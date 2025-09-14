import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="cs">
      <Head>
        {/* Meta tag od Facebooku pro ověření domény */}
        <meta
          name="facebook-domain-verification"
          content="nb4wie94ti4tjxrsj10oxkslpvextx"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
