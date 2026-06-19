export function initializeUi(rootElement) {
    if (!rootElement) {
        throw new Error("App root element was not found.");
    }

    return {
        rootElement,
    };
}
