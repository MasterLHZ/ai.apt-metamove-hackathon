export const formatMarketCoinValues = (data: number) => {
    const formattedData = data / 1e6;
    return formattedData.toString();
}

export function shortenAddress(address: string): string {
    // Check if the address is short enough to not need shortening
    if (address.length <= 10) {
        return address; // If the address is already short, return it as is
    }
    // Extract the first 6 characters and the last 4 characters of the address, joining them with '...'
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    
    return `${start}...${end}`;
}

