/**
 * Global API URL Configuration
 * Centralizes all endpoint definitions to avoid hardcoding in adapters.
 */
export const URLConfig = {
    CHAT: {
        HISTORY: '/rest/biz/v1/history',
        SESSIONS: '/rest/biz/v1/history/sessions',
        AGENT_CHAT: '/rest/agent/v1/chat',
        RATING: (id: number | string) => `/rest/biz/v1/history/${id}/rating`
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
    EPHEMERAL: {
        ROOMS: '/rest/biz/v1/ephemeral/rooms',
        ROOM_INFO: (code: string) => `/rest/biz/v1/ephemeral/rooms/${code}`,
        JOIN: (roomId: string) => `/rest/biz/v1/ephemeral/rooms/${roomId}/join`,
        MESSAGES: (roomId: string) => `/rest/biz/v1/ephemeral/rooms/${roomId}/messages`,
        ME: (roomId: string) => `/rest/biz/v1/ephemeral/rooms/${roomId}/me`,
        DESTROY: (roomId: string) => `/rest/biz/v1/ephemeral/rooms/${roomId}`,
        WS_ENDPOINT: '/ws/ephemeral/websocket'
    },
    EXTERNAL: {
        CASDOOR_ACCOUNT: '/account?application=ai-agent'
    },
    AI_DEV: {
        TASKS: '/rest/biz/v1/ai-dev/tasks',
        PROFILES: '/rest/biz/v1/ai-dev/profiles',
        RESUME: (id: string) => `/rest/biz/v1/ai-dev/tasks/${id}/resume`,
        ROLLBACK: (id: string) => `/rest/biz/v1/ai-dev/tasks/${id}/rollback`,
        REOPEN: (id: string) => `/rest/biz/v1/ai-dev/tasks/${id}/reopen`,
        CONFIG: (id: string) => `/rest/biz/v1/ai-dev/tasks/${id}/config`,
        ASSIGNED_ROLES: (id: string) => `/rest/biz/v1/ai-dev/tasks/${id}/assigned-roles`
    }
};

