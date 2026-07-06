import { GOOGLE_TRACKING_ID } from '@/lib/env';

export default function SeoScript() {
  if (!GOOGLE_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TRACKING_ID}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TRACKING_ID}');
          `,
        }}
      />
    </>
  );
}
