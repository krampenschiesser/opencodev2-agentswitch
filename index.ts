import {Plugin} from "@opencode/plugin"

export default Plugin.define({
    id: "switch-agent",
    async setup(ctx) {
        const agents = new Set<string>()
        await ctx.agent.transform(editor => {
            editor.list()
                .map((e => e.name))
                .forEach(name => agents.add(name.trim().toString()));
        });
        await ctx.tool.transform((editor) => {
            if (editor.get("switch-agent")) return
            editor.namespace({
                name: "sks",
                description: "sks tools",
            })
            editor.add({
                name: "switch-agent",
                description: "Allows the currently active agent to change the sessions agent. Use to switch the agent instead of launching a single sub agent. Use the compact tool when the new agent does not need the full context history.",
                input: {
                    type: "object",
                    properties: {agent_name: {type: "string"}, compact: {type: "bool"}},
                    required: ["agent_name"],
                    additionalProperties: false,
                },
                options: {namespace: "sks", codemode: true},
                execute: async (input, context) => {
                    if (input == null || typeof input != 'object') {
                        throw new Error(`Unexpected input ${JSON.stringify(input)}`);
                    }
                    const sessionID = context.sessionID;

                    const possibleAgentName = 'agent_name' in input
                    && typeof input.agent_name == 'string'
                    && input.agent_name.trim().length > 0
                        ? input.agent_name
                        : null;

                    if (!agents.has(possibleAgentName?.trim() || '')) {
                        throw new Error(`Agent ${possibleAgentName} is not known to opencode`);
                    }
                    const compact = 'compact' in input && typeof input.compact === 'boolean' ? input.compact:false;
                    if (compact) {
                            await ctx.session.compact({sessionID});

                    }
                    await ctx.session.switchAgent({sessionID, agent: possibleAgentName!});
                    return {content:`Switch to agent ${possibleAgentName!}${compact? ' and compacted' : ''}`};
                },
            })
        });
    },
})
