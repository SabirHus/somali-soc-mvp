import Stripe from "stripe";

export async function envCheck(req, res) {
    try {
        const key = process.env.STRIPE_SECRET_KEY || "";
        const priceId = process.env.STRIPE_PRICE_ID || "";
        const stripe = new Stripe(key, { apiVersion: "2023-10-16" });

        const account = await stripe.accounts.retrieve();
        let priceOk = false;
        let priceData = null;
        try {
            priceData = await stripe.prices.retrieve(priceId);
            priceOk = true;
        } catch (e) {
            priceData = { error: e?.message || String(e) };
        }

        res.json({
            ok: true,
            keyPrefix: key ? key.slice(0, 12) : null,
            mode: key.startsWith("sk_test_")
                ? "test"
                : key.startsWith("sk_live_")
                    ? "live"
                    : "unknown",
            account: { id: account.id, business_profile: account?.business_profile },
            priceId,
            priceOk,
            priceData,
            webOrigin: process.env.WEB_ORIGIN,
            appUrl: process.env.APP_URL,
            port: process.env.PORT,
        });
    } catch (err) {
        res.status(500).json({ ok: false, message: err?.message || String(err) });
    }
}
