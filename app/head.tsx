/**
 * Global <head> elements for the Pennywise App, including analytics scripts.
 */
export default function CustomHead() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      {process.env.NEXT_PUBLIC_GTAG_ID && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GTAG_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GTAG_ID}');
              `,
            }}
          />
        </>
      )}
    </>
  );
}