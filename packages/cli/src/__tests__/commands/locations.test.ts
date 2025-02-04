import { outputListing, selectFromList } from '@smartthings/cli-lib'
import LocationsCommand, { chooseLocation } from '../../commands/locations'
import { LocationsEndpoint } from '@smartthings/core-sdk'
import { Config } from '@oclif/core'


const listSpy = jest.spyOn(LocationsEndpoint.prototype, 'list').mockImplementation()

describe('chooseLocation', () => {
	const mockSelectFromList = jest.mocked(selectFromList)

	it('calls selectFromList with correct config and endpoint', async () => {
		const command = new LocationsCommand([], new Config({ root: '' }))

		mockSelectFromList.mockImplementationOnce(async (_command, _config, options) => {
			await options.listItems()
			return 'selected-location-id'
		})

		await chooseLocation(command)

		expect(selectFromList).toBeCalledWith(
			command,
			expect.objectContaining({
				itemName: 'location',
				primaryKeyName: 'locationId',
				sortKeyName: 'name',
			}),
			expect.objectContaining({ preselectedId: undefined }),
		)

		expect(listSpy).toBeCalledTimes(1)
	})
})

describe('LocationsCommand', () => {
	const mockListing = jest.mocked(outputListing)

	it('calls outputListing when no id is provided', async () => {
		await expect(LocationsCommand.run([])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBeUndefined()
	})

	it('calls outputListing when id is provided', async () => {
		const locationId = 'locationId'
		await expect(LocationsCommand.run([locationId])).resolves.not.toThrow()

		expect(mockListing).toBeCalledTimes(1)
		expect(mockListing.mock.calls[0][2]).toBe(locationId)
	})

	it('uses correct endpoints for output', async () => {
		mockListing.mockImplementationOnce(async (_command, _config, _idOrIndex, listFunction, getFunction) => {
			await listFunction()
			await getFunction('chosen-id')
		})

		const getSpy = jest.spyOn(LocationsEndpoint.prototype, 'get').mockImplementation()

		await expect(LocationsCommand.run([])).resolves.not.toThrow()

		expect(mockListing).toBeCalledWith(
			expect.any(LocationsCommand),
			expect.objectContaining({ primaryKeyName: 'locationId' }),
			undefined,
			expect.any(Function),
			expect.any(Function),
		)

		expect(getSpy).toBeCalledTimes(1)
		expect(listSpy).toBeCalledTimes(1)
	})
})
