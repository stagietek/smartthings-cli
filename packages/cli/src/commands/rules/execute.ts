import { Flags } from '@oclif/core'

import { RuleExecutionResponse } from '@smartthings/core-sdk'

import { APICommand, formatAndWriteItem } from '@smartthings/cli-lib'

import { buildExecuteResponseTableOutput, chooseRule, getRuleWithLocation } from '../../lib/commands/rules/rules-util'


export default class RulesExecuteCommand extends APICommand<typeof RulesExecuteCommand.flags> {
	static description = 'execute a rule'

	static flags = {
		...APICommand.flags,
		...formatAndWriteItem.flags,
		'location-id': Flags.string({
			char: 'l',
			description: 'a specific location to query',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	static examples = [
		'# prompt for a rule to execute and then execute it',
		'$ smartthings rules:execute',
		'',
		'# execute the rule with the specified id',
		'$ smartthings rules:execute 699c7308-8c72-4363-9571-880d0f5cc725',
	]

	async run(): Promise<void> {
		const ruleId = await chooseRule(this, 'Select a rule to execute.', this.flags['location-id'], this.args.id)

		const locationId = this.flags['location-id']
			?? (await getRuleWithLocation(this.client, ruleId, this.flags['location-id'])).locationId

		const result = await this.client.rules.execute(ruleId, locationId)
		await formatAndWriteItem<RuleExecutionResponse>(this,
			{ buildTableOutput: (data: RuleExecutionResponse) => buildExecuteResponseTableOutput(this.tableGenerator, data) },
			result)
	}
}
