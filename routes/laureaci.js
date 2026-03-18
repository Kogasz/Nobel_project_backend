import express from "express";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/node", async (req, res) => {
  const db = getDB();
  try {
    const data = await db.collection("laureaci").find().toArray();
    console.log('Total laureates in database:', data.length);
    if (data.length > 0) {
      console.log('First laureate prizes:', JSON.stringify(data[0].prizes, null, 2));
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

router.get("/node/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    const laureat = await db
      .collection("laureaci")
      .findOne({ _id: new ObjectId(id) });
    res.json(laureat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});


router.get("/node/countries/counts", async (req, res) => {
  const db = getDB();

  try {
    const collection = db.collection("laureaci");

    const result = await collection
      .aggregate([
        {
          $group: {
            _id: "$bornCountryCode",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const map = {};

    result.forEach((r) => {
      map[r._id] = { count: r.count };
    });

    res.json(map);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error" });
  }
});

router.get("/node/country/:code", async (req, res) => {
  const db = getDB();
  const { code } = req.params;

  try {
    const collection = db.collection("laureaci");

    const laureaci = await collection
      .find(
        { bornCountryCode: code },
        { projection: { firstname: 1, surname: 1, _id: 0 } }
      )
      .toArray();

    const categoryAgg = await collection
      .aggregate([
        { $match: { bornCountryCode: code } },
        { $unwind: "$prizes" },
        {
          $group: {
            _id: "$prizes.category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ])
      .toArray();

    const mostCommonCategory =
      categoryAgg.length > 0 ? categoryAgg[0]._id : null;

    res.json({
      count: laureaci.length,
      laureaci,
      mostCommonCategory,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error" });
  }
});

router.get("/stats/categories", async (req, res) => {
  const db = getDB();

  try {
    const result = await db.collection("laureaci")
      .aggregate([
        { $unwind: "$prizes" },

        {
          $group: {
            _id: "$prizes.category",
            count: { $sum: 1 },
          },
        },

        { $sort: { count: -1 } },
      ])
      .toArray();

    const data = result.map(r => ({
      category: r._id,
      count: r.count,
    }));

    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error" });
  }
});


router.get("/stats/years", async (req, res) => {
  const db = getDB();

  try {
    const result = await db.collection("laureaci")
      .aggregate([
        { $unwind: "$prizes" },

        {
          $group: {
            _id: "$prizes.year",
            count: { $sum: 1 },
          },
        },

        { $sort: { _id: 1 } },
      ])
      .toArray();

    const data = result.map(r => ({
      year: r._id,
      count: r.count,
    }));

    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error" });
  }
});


router.get("/stats/countries", async (req, res) => {
  const db = getDB();

  try {
    const result = await db.collection("laureaci")
      .aggregate([
        {
          $group: {
            _id: "$bornCountry",
            count: { $sum: 1 },
          },
        },

        { $sort: { count: -1 } },

        { $limit: 10 },
      ])
      .toArray();

    const data = result.map(r => ({
      country: r._id,
      count: r.count,
    }));

    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error" });
  }
});

router.get("/filter", async (req, res) => {
  const db = getDB();
  try {
    const { category, yearFrom, yearTo, search } = req.query;

    const query = {};

    if (category) {
      query["prizes.category"] = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (yearFrom || yearTo) {
      const yearMatch = {};
      if (yearFrom) yearMatch.$gte = String(yearFrom);
      if (yearTo)   yearMatch.$lte = String(yearTo);
      query["prizes.year"] = yearMatch;
    }

    if (search) {
      query.surname = { $regex: search, $options: "i" };
    }

    const laureaci = await db.collection("laureaci").find(query).toArray();
    res.json(laureaci);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});


export default router;