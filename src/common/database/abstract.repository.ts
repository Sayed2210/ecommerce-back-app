import { Repository as TypeORMRepository, ObjectLiteral, FindOptionsWhere, DeepPartial, FindManyOptions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class AbstractRepository<T extends ObjectLiteral> {
    constructor(protected readonly repository: TypeORMRepository<T>) { }

    async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
        return this.repository.findOne({ where });
    }

    async findOneOrFail(where: FindOptionsWhere<T>): Promise<T> {
        return this.repository.findOneOrFail({ where });
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.find(options);
    }

    async findWithPagination(
        page: number = 1,
        limit: number = 10,
        where?: FindOptionsWhere<T>,
    ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.repository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit };
    }

    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    async update(id: string, data: QueryDeepPartialEntity<T>): Promise<T> {
        await this.repository.update(id, data);
        return this.findOneOrFail({ id } as unknown as FindOptionsWhere<T>);
    }

    async softDelete(id: string): Promise<void> {
        await this.repository.softDelete(id);
    }

    async restore(id: string): Promise<void> {
        await this.repository.restore(id);
    }

    async permanentDelete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}