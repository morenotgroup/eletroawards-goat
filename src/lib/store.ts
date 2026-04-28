import { Redis } from "@upstash/redis";
import { AWARD_CATEGORIES } from "@/lib/awards";

export type VotePayload = {
  cpfHash: string;
  voterName: string;
  voterEmail?: string;
  votes: Record<string, string | null>;
  submittedCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
  userAgent?: string | null;
};

export type VotingConfig = {
  categories: Record<string, boolean>;
  updatedAt: string;
  updatedBy?: string | null;
};

const memory = new Map<string, VotePayload>();
const memoryIndex = new Set<string>();

function buildDefaultConfig(): VotingConfig {
  return {
    categories: Object.fromEntries(
      AWARD_CATEGORIES.map((category) => [category.id, category.stage === 1])
    ),
    updatedAt: new Date().toISOString(),
    updatedBy: "system-default"
  };
}

let memoryConfig: VotingConfig = buildDefaultConfig();

function redisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

const PREFIX = "eletroawards2026goat";
const voteKey = (cpfHash: string) => `${PREFIX}:vote:${cpfHash}`;
const indexKey = `${PREFIX}:vote-index`;
const configKey = `${PREFIX}:config`;

function normalizeVote(raw: unknown): VotePayload | null {
  if (!raw || typeof raw !== "object") return null;

  const value = raw as Partial<VotePayload>;

  if (!value.cpfHash || !value.voterName || !value.votes) return null;

  const submittedCategoryIds =
    Array.isArray(value.submittedCategoryIds) && value.submittedCategoryIds.length
      ? value.submittedCategoryIds
      : Object.entries(value.votes)
          .filter(([, selected]) => Boolean(selected))
          .map(([categoryId]) => categoryId);

  const createdAt = value.createdAt || new Date().toISOString();
  const updatedAt = value.updatedAt || createdAt;

  return {
    cpfHash: value.cpfHash,
    voterName: value.voterName,
    voterEmail: value.voterEmail,
    votes: value.votes,
    submittedCategoryIds,
    createdAt,
    updatedAt,
    userAgent: value.userAgent || null
  };
}

export async function getVotingConfig(): Promise<VotingConfig> {
  const redis = redisClient();

  if (!redis) return memoryConfig;

  const stored = (await redis.get(configKey)) as VotingConfig | null;

  if (!stored || !stored.categories) {
    const defaultConfig = buildDefaultConfig();
    await redis.set(configKey, defaultConfig);
    return defaultConfig;
  }

  const mergedCategories = {
    ...buildDefaultConfig().categories,
    ...stored.categories
  };

  return {
    categories: mergedCategories,
    updatedAt: stored.updatedAt || new Date().toISOString(),
    updatedBy: stored.updatedBy || null
  };
}

export async function saveVotingConfig(
  categories: Record<string, boolean>,
  updatedBy?: string | null
): Promise<VotingConfig> {
  const normalized: Record<string, boolean> = {};

  for (const category of AWARD_CATEGORIES) {
    normalized[category.id] = Boolean(categories[category.id]);
  }

  const config: VotingConfig = {
    categories: normalized,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || "admin"
  };

  const redis = redisClient();

  if (!redis) {
    memoryConfig = config;
    return config;
  }

  await redis.set(configKey, config);

  return config;
}

export async function getVote(cpfHash: string) {
  const key = voteKey(cpfHash);
  const redis = redisClient();

  if (!redis) {
    return memory.get(key) || null;
  }

  const stored = await redis.get(key);

  return normalizeVote(stored);
}

export async function hasAnyVote(cpfHash: string) {
  return Boolean(await getVote(cpfHash));
}

export async function mergeVote(payload: {
  cpfHash: string;
  voterName: string;
  voterEmail?: string;
  votes: Record<string, string | null>;
  submittedCategoryIds: string[];
  userAgent?: string | null;
}) {
  const key = voteKey(payload.cpfHash);
  const redis = redisClient();
  const existing = await getVote(payload.cpfHash);
  const now = new Date().toISOString();

  const merged: VotePayload = {
    cpfHash: payload.cpfHash,
    voterName: payload.voterName,
    voterEmail: payload.voterEmail,
    votes: {
      ...(existing?.votes || {}),
      ...payload.votes
    },
    submittedCategoryIds: Array.from(
      new Set([
        ...(existing?.submittedCategoryIds || []),
        ...payload.submittedCategoryIds
      ])
    ),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    userAgent: payload.userAgent || existing?.userAgent || null
  };

  if (!redis) {
    memory.set(key, merged);
    memoryIndex.add(key);
    return merged;
  }

  await redis.set(key, merged);
  await redis.sadd(indexKey, key);

  return merged;
}

export async function getAllVotes() {
  const redis = redisClient();

  if (!redis) {
    return Array.from(memoryIndex)
      .map((key) => memory.get(key))
      .filter((value): value is VotePayload => Boolean(value));
  }

  const keys = (await redis.smembers(indexKey)) as string[];

  if (!keys.length) return [];

  const values = (await redis.mget(...keys)) as unknown[];

  return values
    .map(normalizeVote)
    .filter((value): value is VotePayload => Boolean(value));
}

export async function clearAllVotes() {
  const redis = redisClient();

  if (!redis) {
    memory.clear();
    memoryIndex.clear();
    return { deleted: 0 };
  }

  const keys = (await redis.smembers(indexKey)) as string[];

  if (keys.length) {
    await redis.del(...keys);
  }

  await redis.del(indexKey);

  return { deleted: keys.length };
}

export function storageMode() {
  return redisClient() ? "redis" : "memory-dev";
}
