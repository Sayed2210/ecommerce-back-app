export class SlugUtil {
    static create(str: string): string {
        return str
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
    }
}
