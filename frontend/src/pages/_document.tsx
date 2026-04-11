import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ ADD FAVICON */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <meta name="description" content="Digi ChainStore - Multi-chain digital products marketplace" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}