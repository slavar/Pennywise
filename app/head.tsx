/**
 * Global <head> elements for the Pennywise App, including analytics scripts.
 */
export default function Head() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-17250895076"
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17250895076');
          `,
        }}
      />
    </>
  );
}