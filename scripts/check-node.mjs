const [major] = process.versions.node.split('.').map(Number);

if (Number.isNaN(major) || major < 20) {
  console.error(
    `Node ${process.versions.node} detected. This project requires Node >= 20 because Vite 6 depends on Web Crypto APIs (crypto.getRandomValues).`
  );
  console.error('Use `nvm use 20` (or install Node 20+) and retry.');
  process.exit(1);
}
