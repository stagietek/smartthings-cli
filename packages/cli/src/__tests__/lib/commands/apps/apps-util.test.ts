import { Config } from '@oclif/core'

import { AppsEndpoint, NoOpAuthenticator, SmartThingsClient } from '@smartthings/core-sdk'

import { APICommand, ChooseOptions, chooseOptionsDefaults, chooseOptionsWithDefaults,
	selectFromList, stringTranslateToId } from '@smartthings/cli-lib'

import { chooseApp } from '../../../../lib/commands/apps/apps-util'


jest.mock('@smartthings/cli-lib', () => {
	const originalLib = jest.requireActual('@smartthings/cli-lib')

	return {
		...originalLib,
		// TODO export from testlib
		APICommand: class {
			get client(): SmartThingsClient {
				return new SmartThingsClient(new NoOpAuthenticator)
			}
		},
		chooseOptionsWithDefaults: jest.fn(opts => opts),
		stringTranslateToId: jest.fn(),
		selectFromList: jest.fn(),
	}
})

describe('chooseApp', () => {
	const appId = 'appId'
	const stringIndex = 'stringIndex'
	const listSpy = jest.spyOn(AppsEndpoint.prototype, 'list').mockResolvedValue([])
	const mockStringTranslateToId = jest.mocked(stringTranslateToId)
	const mockSelect = jest.mocked(selectFromList)
	const mockChooseOpts = jest.mocked(chooseOptionsWithDefaults)

	class MockCommand extends APICommand {
		async run(): Promise<void> {
			// eslint-disable-line @typescript-eslint/no-empty-function
		}
	}

	const command = new MockCommand([], new Config({ root: '' }))

	beforeAll(() => {
		mockChooseOpts.mockImplementation(() => {
			return chooseOptionsDefaults
		})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('sets defaults for passed options', async () => {
		const opts: Partial<ChooseOptions> = {}
		await chooseApp(command, undefined, opts)

		expect(chooseOptionsWithDefaults).toBeCalledWith(opts)
	})

	it('resolves id from index when allowed', async () => {
		const opts: ChooseOptions = {
			...chooseOptionsDefaults,
			allowIndex: true,
		}
		mockChooseOpts.mockReturnValueOnce(opts)
		mockStringTranslateToId.mockResolvedValueOnce(appId)

		const expectedConfig = {
			itemName: 'app',
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}

		await chooseApp(command, stringIndex, opts)

		expect(stringTranslateToId).toBeCalledWith(
			expect.objectContaining(expectedConfig),
			stringIndex,
			expect.any(Function),
		)

		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			appId,
			expect.any(Function),
		)
	})

	it('uses app id arg when index not allowed', async () => {
		const opts: Partial<ChooseOptions> = {
			allowIndex: false,
		}
		const expectedConfig = {
			itemName: 'app',
			primaryKeyName: 'appId',
			sortKeyName: 'displayName',
		}

		await chooseApp(command, appId, opts)

		expect(stringTranslateToId).not.toBeCalled()
		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining(expectedConfig),
			appId,
			expect.any(Function),
		)
	})

	it('uses same list function for index resolution and app selection', async () => {
		const opts: ChooseOptions = {
			...chooseOptionsDefaults,
			allowIndex: true,
		}
		mockChooseOpts.mockReturnValueOnce(opts)
		mockStringTranslateToId.mockResolvedValueOnce(appId)

		await chooseApp(command, stringIndex, opts)

		expect(stringTranslateToId).toBeCalledTimes(1)
		expect(selectFromList).toBeCalledTimes(1)

		const translateList = mockStringTranslateToId.mock.calls[0][2]
		const selectList = mockSelect.mock.calls[0][3]

		expect(translateList).toBe(selectList)
	})

	it('uses correct endpoint to list apps', async () => {
		mockSelect.mockImplementationOnce(async (_command, _config, _id, listFunction) => {
			await listFunction()
			return appId
		})

		await chooseApp(command, appId)

		expect(listSpy).toBeCalled()
	})
})

describe('buildTableOutput', () => {
	it.todo('returns simple string when app settings are not present')
})
