/**
 * Global API URL Configuration
 * Centralizes all endpoint definitions to avoid hardcoding in adapters.
 */
export const URLConfig = {
    CHAT: {
        HISTORY: '/rest/biz/v1/history',
        SESSIONS: '/rest/biz/v1/history/sessions',
        AGENT_CHAT: '/rest/agent/v1/chat'
    },
    KNOWLEDGE: {
        BASE: '/rest/biz/v1/knowledge',
        UPLOAD: '/rest/biz/v1/upload/knowledge',
        BUILD_RECIPE: '/rest/agent/v1/knowledge/build',
        TASK_PROGRESS: (id: string) => `/rest/biz/v1/tasks/${id}`
    },
    EVENTS: {
        BASE: '/rest/biz/v1/time-limit-events'
    },
    PROMPT: {
        TEMPLATES: '/rest/biz/v1/prompts/templates',
        VERSIONS: '/rest/biz/v1/prompts/versions'
    },
    MCP: {
        PLUGINS: '/rest/biz/v1/mcp-plugins',
        TOGGLE: (id: string) => `/rest/biz/v1/mcp-plugins/${id}/toggle`,
        REFRESH: (id: string) => `/rest/biz/v1/mcp-plugins/${id}/refresh`
    },
    DEVICES: {
        // Future placeholders
    },
    EXTERNAL: {
        CASDOOR_ACCOUNT: '/account?application=ai-agent'
    }
};
