export function removeHost(url: string) {
  let r = url.replace(/^.*\/\/[^/]+/, "");
  if (r === "") {
    r = "/";
  }
  return r;
}
