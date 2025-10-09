import { genkit } from 'genkit';

let googleAI: any = undefined;
try {
  // optional import - the package might not be installed in all environments
  // require is used to avoid static type import errors during typecheck when package is missing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  googleAI = require('@genkit-ai/googleai').googleAI;
} catch (e) {
  // module not available, proceed without plugin
  googleAI = undefined;
}

export const ai = genkit({
  plugins: googleAI ? [googleAI()] : [],
  model: 'googleai/gemini-2.5-flash',
});
