// Idempotent seed: towns, places, placeholder images, admin user.
// Re-running never overwrites places edited by an admin unless --force is passed.
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { provinceOf } from "@/shared/constants/geography";
import { createDb } from "../db/client";
import { placeImages, places, towns, user } from "../db/schema";
import { IMMUTABLE_CACHE, processImage } from "../lib/images";
import { createStorage } from "../storage/storage";
import { env } from "../env";
import { placeholderSvg } from "./placeholders";
import { ALL_SEED_PLACES as SEED_PLACES } from "./all-places";
import { SEED_TOWNS } from "./towns";

const force = process.argv.includes("--force");
const e = env();
const { db, pool } = createDb(e.DATABASE_URL);
const storage = createStorage(e);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function seedTowns() {
  for (const t of SEED_TOWNS) {
    const values = {
      name: t.name,
      slug: slugify(t.name),
      district: t.district,
      province: provinceOf(t.district),
      location: { lat: t.lat, lng: t.lng },
      isHub: t.hub ?? false,
    };
    await db
      .insert(towns)
      .values(values)
      .onConflictDoUpdate({ target: towns.slug, set: { ...values, slug: undefined } });
  }
  console.log(`✓ ${SEED_TOWNS.length} towns`);
}

async function seedPlaces() {
  let inserted = 0;
  for (const p of SEED_PLACES) {
    const values = {
      slug: p.slug,
      name: p.name,
      category: p.category,
      location: { lat: p.lat, lng: p.lng },
      visitRadiusM: p.visitRadiusM,
      district: p.district,
      province: provinceOf(p.district),
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      bestMonths: p.bestMonths,
      dressCode: p.dressCode ?? null,
      safetyNotes: p.safetyNotes ?? null,
      // Never invent facts: these stay null until verified on the ground.
      openingHours: null,
      feeForeignLkr: null,
      feeLocalLkr: null,
      howToGetThere: p.howToGetThere ?? null,
      isVerified: false,
      status: "published" as const,
    };
    const q = db.insert(places).values(values);
    const res = force
      ? await q
          .onConflictDoUpdate({ target: places.slug, set: { ...values, slug: undefined } })
          .returning({ id: places.id })
      : await q.onConflictDoNothing({ target: places.slug }).returning({ id: places.id });
    inserted += res.length;
  }
  console.log(`✓ ${SEED_PLACES.length} places (${inserted} ${force ? "upserted" : "new"})`);
}

async function seedPlaceholderImages() {
  const all = await db
    .select({ id: places.id, slug: places.slug, name: places.name, category: places.category })
    .from(places);
  let created = 0;
  for (const p of all) {
    const [existing] = await db
      .select({ id: placeImages.id })
      .from(placeImages)
      .where(and(eq(placeImages.placeId, p.id), eq(placeImages.source, "official")))
      .limit(1);
    if (existing) continue;

    const png = await sharp(Buffer.from(placeholderSvg(p.category, p.slug)))
      .png()
      .toBuffer();
    const imageId = randomUUID();
    const processed = await processImage(png, `places/${p.id}/${imageId}`);
    await Promise.all(
      processed.files.map((f) => storage.put("public", f.key, f.body, f.contentType, IMMUTABLE_CACHE)),
    );
    await db.transaction(async (tx) => {
      await tx.insert(placeImages).values({
        id: imageId,
        placeId: p.id,
        variants: processed.variants,
        width: processed.width,
        height: processed.height,
        lqip: processed.lqip,
        altText: `Illustrated placeholder artwork for ${p.name}`,
        source: "official",
        attribution: "TukTrail placeholder illustration",
        license: "CC0-1.0",
        status: "approved",
        moderatedAt: new Date(),
      });
      await tx.update(places).set({ heroImageId: imageId }).where(eq(places.id, p.id));
    });
    created++;
  }
  console.log(`✓ placeholder images (${created} new)`);
}

async function seedAdmin() {
  const email = e.SEED_ADMIN_EMAIL;
  if (!email) {
    console.log("• SEED_ADMIN_EMAIL not set, skipping admin user");
    return;
  }
  await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: "TukTrail Admin",
      email: email.toLowerCase(),
      emailVerified: true,
      role: "admin",
    })
    .onConflictDoUpdate({ target: user.email, set: { role: "admin" } });
  console.log(`✓ admin user ${email}`);
}

try {
  await seedTowns();
  await seedPlaces();
  await seedPlaceholderImages();
  await seedAdmin();
  const [{ count }] = (
    await db.execute<{ count: number }>(
      sql`select count(*)::int as count from places where status = 'published'`,
    )
  ).rows as [{ count: number }];
  console.log(`✓ seed complete — ${count} published places`);
} finally {
  await pool.end();
}
