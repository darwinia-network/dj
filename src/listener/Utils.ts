
export function setDelay(t: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    });
}