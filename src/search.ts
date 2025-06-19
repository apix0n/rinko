export function getSearchPluginXml(origin: string): string {
    return `
  <OpenSearchDescription
    xmlns="http://a9.com/-/spec/opensearch/1.1/"
    xmlns:moz="http://www.mozilla.org/2006/browser/search/">
    <ShortName>rinko</ShortName>
    <Image width="32" height="32" type="image/png">${origin}/_/favicon.png</Image>
    <Url type="text/html" template="${origin}/_/search?source=opensearch&amp;q={searchTerms}"/>
    <Url type="application/opensearchdescription+xml" rel="self" template="${origin}/_/search.xml" />
  </OpenSearchDescription>
    `.trim();
}

export function searchPage(origin: string): string { 
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>rinko // add search plugin</title>
        <link rel="stylesheet" href="/_/styles.css">
        <link rel="shortcut icon" href="/_/favicon.png" type="image/png">
        <link rel="search" type="application/opensearchdescription+xml" title="rinko" href="/_/search.xml" />
    </head>
    <body>
        <div class="center-container">
            <div>
                <h1>rinko</h1>
                <p>search plugin</p>
                <p>${origin}/_/search?q=%s</p>
            </div>
        </div>
        <footer>
            <span>rinko</span>
            <span><a href="https://github.com/apix0n" target="_blank">by apix</a></span>
            <span><a href="/_/">admin panel</a></span>
        </footer>
    </body>
</html>`
}