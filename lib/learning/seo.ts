export function learningIndexable({
  vercel = process.env.VERCEL_ENV,
  netlify = process.env.CONTEXT,
}: { vercel?: string; netlify?: string } = {}) {
  if (vercel) return vercel === 'production';
  return netlify === 'production';
}

export function learningRobots() {
  const index = learningIndexable();
  return { index, follow: index, googleBot: { index, follow: index } };
}

export const learningResourceId = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
