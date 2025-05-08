import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "utils/ab-testing";
import { BUCKETS, facetParams } from "constants/index";
// Import GeneratedBloomFilter from "./lib/redirects/bloom-filter.json"; // Baris ini dihapus
// import { ScalableBloomFilter } from "bloom-filters"; // Baris ini dihapus

// type RedirectEntry = { // Tipe data ini tidak lagi dibutuhkan
//   destination: string;
//   permanent: boolean;
// };

type Route = {
  page: string;
  cookie: string;
  buckets: readonly string[];
};

// Variabel atau inisialisasi terkait Bloom Filter dan redirects dihapus
// let initializedBloomFilter: ScalableBloomFilter | null = null; // Baris ini dihapus


const ROUTES: Record<string, Route | undefined> = {
  "/": {
    page: "/home",
    cookie: "bucket-home",
    buckets: BUCKETS.HOME,
  },
  // ... tambahkan rute lain di sini jika ada
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // === Logika terkait BLOOM_FILTER dan redirects dihapus ===
  // const homeAwarePathname = pathname === "/" ? "/home" : pathname; // Baris ini dihapus
  //
  // if (!initializedBloomFilter) { // Blok inisialisasi dihapus
  //   try {
  //     initializedBloomFilter = ScalableBloomFilter.fromJSON(GeneratedBloomFilter as any);
  //   } catch (error) {
  //     console.error("Error initializing Bloom Filter:", error);
  //     return NextResponse.next();
  //   }
  // }
  // const BLOOM_FILTER = initializedBloomFilter; // Baris ini dihapus
  //
  // if (BLOOM_FILTER.has(homeAwarePathname)) { // Blok kondisional Bloom Filter dihapus
  //   const response = await handleRedirectsMiddleware(request);
  //
  //   if (response) {
  //     return response;
  //   }
  // }
  // =====================================================


  // Logika A/B Testing dan Custom Routing tetap dipertahankan
  const route = ROUTES[pathname];
  if (route) {
    return handleAbTestingMiddleware(request, route);
  }

  if (isCLP(request)) {
    return handleCLPMiddleware(request);
  }

  if (isPLP(request)) {
    return handlePLPMiddleware(request);
  }

  // Jika tidak ada middleware lain yang cocok, lewati permintaan
  return NextResponse.next();
}

// Fungsi handleRedirectsMiddleware dihapus karena tidak lagi digunakan tanpa Bloom Filter
// async function handleRedirectsMiddleware(request: NextRequest) {
//   const api = new URL(`/api/redirects?pathname=${encodeURIComponent(request.nextUrl.pathname)}`, request.nextUrl.origin);
//   try {
//     const redirectData = await fetch(api);
//     if (redirectData.ok) {
//       const redirectEntry = (await redirectData.json()) as RedirectEntry | undefined;
//       if (redirectEntry) {
//         const statusCode = redirectEntry.permanent ? 308 : 307;
//         return NextResponse.redirect(new URL(redirectEntry.destination, request.nextUrl.origin), statusCode);
//       }
//     }
//   } catch (error) {
//     console.error("Error in handleRedirectsMiddleware:", error);
//     return NextResponse.next();
//   }
// }


function handleAbTestingMiddleware(request: NextRequest, route: Route) {
  let bucket = request.cookies.get(route.cookie)?.value;
  let hasBucket = !!bucket;

  if (!bucket || !route.buckets.includes(bucket as string)) {
    bucket = getBucket(route.buckets);
    hasBucket = false;
  }

  const url = request.nextUrl.clone();
  url.pathname = `${route.page}/${bucket}`;

  const res = NextResponse.rewrite(url);
  !hasBucket && res.cookies.set(route.cookie, bucket as string);

  return res;
}

function handleCLPMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const page = request.nextUrl.searchParams.get("page");
  const isAi = request.nextUrl.pathname.startsWith("/ai/category");

  const pathSegments = request.nextUrl.pathname.split("/");
  const segmentIndex = isAi ? 3 : 2;

  if (page) {
    if (pathSegments.length > segmentIndex) {
       url.pathname = `${isAi ? "ai/category" : "category"}/clp/${pathSegments[segmentIndex]}/${page}`;
       url.searchParams.delete("page");
       return NextResponse.rewrite(url);
    } else {
       console.error("Path segment missing for CLP");
       return NextResponse.next();
    }
  }

  if (pathSegments.length > segmentIndex) {
      url.pathname = `${isAi ? "ai/category" : "category"}/clp/${pathSegments[segmentIndex]}`;
      return NextResponse.rewrite(url);
  } else {
      console.error("Path segment missing for CLP without page param");
      return NextResponse.next();
  }
}

function handlePLPMiddleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const isAi = request.nextUrl.pathname.startsWith("/ai/category");

  const pathSegments = request.nextUrl.pathname.split("/");
  const segmentIndex = isAi ? 3 : 2;

  if (pathSegments.length > segmentIndex) {
      url.pathname = `${isAi ? "ai/category" : "category"}/plp/${pathSegments[segmentIndex]}`;
      return NextResponse.rewrite(url);
  } else {
      console.error("Path segment missing for PLP");
      return NextResponse.next();
  }
}


export const config = {
  // Konfigurasi unstable_allowDynamic mungkin tidak lagi diperlukan tanpa bloom-filters
  // Jika masih ada masalah di masa mendatang, pertimbangkan untuk menghapusnya atau menyesuaikannya.
  unstable_allowDynamic: ["**/node_modules/lodash/lodash.js", "**/node_modules/reflect-metadata/Reflect.js"],
  matcher: ["/", "/((?!api|_next|cache-healthcheck|health|_vercel|.*\\..*).*)"],
};

function isCLP(request: NextRequest): boolean {
  const isCategory = request.nextUrl.pathname.startsWith("/category/");
  const isInternalRoute = request.nextUrl.pathname.startsWith("/category/clp/");

  const isAiCategory = request.nextUrl.pathname.startsWith("/ai/category/");
  const isAiInternalRoute = request.nextUrl.pathname.startsWith("/ai/category/clp/");

  const isFaceted = facetParams.some((param) => request.nextUrl.searchParams.has(param));

  return (isCategory && !isFaceted && !isInternalRoute) || (isAiCategory && !isFaceted && !isAiInternalRoute);
}

function isPLP(request: NextRequest): boolean {
  const isCategory = request.nextUrl.pathname.startsWith("/category/");
  const isInternalRoute = request.nextUrl.pathname.startsWith("/category/plp/");

  const isAiCategory = request.nextUrl.pathname.startsWith("/ai/category/");
  const isAiInternalRoute = request.nextUrl.pathname.startsWith("/ai/category/plp/");

  const isFaceted = facetParams.some((param) => request.nextUrl.searchParams.has(param));

  return (isCategory && isFaceted && !isInternalRoute) || (isAiCategory && isFaceted && !isAiInternalRoute);
}