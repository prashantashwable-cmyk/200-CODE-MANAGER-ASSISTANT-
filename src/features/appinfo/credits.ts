import pkg from '../../../package.json';

/** What each thing the app is built on is used for. The list of packages is read from the app's own package.json, so a new dependency appears here by itself. */
export interface Credit { name: string; version: string; purpose: 'icons' | 'language' | 'maps' | 'framework' | 'routing' | 'charts' | 'reading' | 'tooling' | 'other'; runtime: boolean }
const PURPOSE: Record<string, Credit['purpose']> = {
  '@phosphor-icons/react': 'icons', i18next: 'language', 'react-i18next': 'language', leaflet: 'maps', 'react-leaflet': 'maps', react: 'framework', 'react-dom': 'framework',
  'react-router-dom': 'routing', recharts: 'charts', 'tesseract.js': 'reading', vite: 'tooling', typescript: 'tooling', '@vitejs/plugin-react': 'tooling',
};
export const creditsOf = (): Credit[] => {
  const deps = Object.entries((pkg as { dependencies?: Record<string, string> }).dependencies ?? {}).map(([name, version]) => ({ name, version: version.replace(/^[^\d]*/, ''), purpose: PURPOSE[name] ?? 'other', runtime: true }));
  const dev = Object.entries((pkg as { devDependencies?: Record<string, string> }).devDependencies ?? {}).filter(([n]) => !n.startsWith('@types/')).map(([name, version]) => ({ name, version: version.replace(/^[^\d]*/, ''), purpose: PURPOSE[name] ?? 'other', runtime: false }));
  return [...deps, ...dev].sort((a, b) => Number(b.runtime) - Number(a.runtime) || a.name.localeCompare(b.name));
};
/** The version this build was made as (package.json). */
export const BUILD_VERSION: string = (pkg as { version: string }).version;
/** Services the app loads at run time and the credit they ask for. */
export const SERVICES = ['google_fonts', 'osm'] as const;
