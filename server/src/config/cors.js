export const corsOptions = {
    origin: (origin, cb) => {
        const allow = [process.env.WEB_ORIGIN, undefined]; // allow your web and tools
        cb(null, allow.includes(origin));
    },
    credentials: true
};
