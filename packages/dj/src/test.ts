import Fetcher from "./fetcher";

(async () => {
    const fetcher = await Fetcher.new();
    await fetcher.serve(3000);
})();
