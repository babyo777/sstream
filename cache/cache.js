import NodeCache from "node-cache";

export const VibeCache = new NodeCache({
  stdTTL: 86400,
});
