export function getSubdomain() {
    // Determine if there's a subdomain.
    const hostParts = window.location.hostname.split(".");
    const firstPart = hostParts[0];
    const secondPart = hostParts[1];
    return secondPart === undefined || /^(localhost|bookish)$/.test(firstPart) ? undefined : firstPart;
}

export function pathWithoutSubdomain(path: string) {

  // If there's no subdomain, just return the path.
  const subdomain = getSubdomain();
  if(subdomain === undefined) return path;

  // Otherwise, return a full URL without the subdomain
  return `${window.location.protocol}//${window.location.host.replace(subdomain + ".", "")}${path}${window.location.search}`;

}

export function getSubdomainURL(subdomain: string) { 

  const parts = window.location.host.split(".");
  // Construct a URL from the subdomain and the last one or two parts of the host (accounting for localhost and normal domains and top level domains.)
  return `${window.location.protocol}//${subdomain}.${parts.length > 1 ? `${parts[parts.length - 2]}.` : ""}${parts[parts.length - 1]}`;

}