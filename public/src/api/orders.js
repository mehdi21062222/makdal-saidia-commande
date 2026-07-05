import { kv } from "@vercel/kv";

const ORDERS_KEY = "makdal_saidia_orders";
const COUNTER_KEY = "makdal_saidia_counter";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const orders = (await kv.get(ORDERS_KEY)) || [];
      return res.status(200).json(orders);
    }

    if (req.method === "POST") {
      const { items, note, total } = req.body || {};
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "items requis" });
      }
      const orders = (await kv.get(ORDERS_KEY)) || [];
      let counter = (await kv.get(COUNTER_KEY)) || 0;
      counter += 1;

      const newOrder = {
        id: Date.now(),
        number: counter,
        items,
        note: note || "",
        total: total || 0,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" }),
        status: "attente",
      };

      orders.unshift(newOrder);
      const trimmed = orders.slice(0, 500);

      await kv.set(ORDERS_KEY, trimmed);
      await kv.set(COUNTER_KEY, counter);

      return res.status(200).json(newOrder);
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: "id et status requis" });
      let orders = (await kv.get(ORDERS_KEY)) || [];
      orders = orders.map(o => (o.id === id ? { ...o, status } : o));
      await kv.set(ORDERS_KEY, orders);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      let orders = (await kv.get(ORDERS_KEY)) || [];
      orders = orders.filter(o => o.status !== "servi");
      await kv.set(ORDERS_KEY, orders);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
}
