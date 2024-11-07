// app/config/auth.ts

export const AUTH_CONFIG = {
    timeout: {
        duration: 30 * 60 * 1000,  // 30分钟
        warning: 5 * 10 * 1000     // 5分钟
    },

    whitelistRoutes: [
        '/auth',
    ],

    routes: {
        login: '/auth',
        home: '/'
    }
};