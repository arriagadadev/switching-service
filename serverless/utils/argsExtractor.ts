const [, , ...args] = process.argv;

const argsExtractor = (argName: string, defaultValue: string): string => {
  const argIndex = args.findIndex((arg) => arg === `--${argName}`);
  if (argIndex === -1 || args.length < argIndex) return defaultValue;
  return args[argIndex + 1];
};

export default argsExtractor;
