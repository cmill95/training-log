"use client"; // Error boundaries must be Client Components

import "./globals.css";
import ErrorPage from "./error";

// Catches errors in the root layout itself, which error.tsx can't (it renders
// inside that layout). It replaces the layout, so it brings its own <html>,
// <body> and styles, then reuses error.tsx for the content.
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <title>Something went wrong · Training Log</title>
        <ErrorPage {...props} />
      </body>
    </html>
  );
}
