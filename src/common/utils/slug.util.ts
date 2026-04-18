import { Repository } from 'typeorm';

export class SlugUtil {
  static create(str: string): string {
    return str
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  static async generateUniqueSlug(
    name: string,
    repo: Repository<any>,
  ): Promise<string> {
    const slug = this.create(name);
    const exists = await repo.findOne({ where: { slug } });
    if (!exists) return slug;

    let count = 1;
    for (;;) {
      const newSlug = `${slug}-${count}`;
      const exists = await repo.findOne({ where: { slug: newSlug } });
      if (!exists) return newSlug;
      count++;
    }
  }
}
