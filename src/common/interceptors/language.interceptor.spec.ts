import { LanguageInterceptor } from './language.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LanguageInterceptor', () => {
    let interceptor: LanguageInterceptor;

    beforeEach(() => {
        interceptor = new LanguageInterceptor();
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should return original data if no lang is specified', (done) => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ query: {}, headers: {} }),
            }),
        } as unknown as ExecutionContext;

        const next = {
            handle: () => of({ name: { en: 'Name', ar: 'الاسم' } }),
        } as CallHandler;

        interceptor.intercept(context, next).subscribe((result) => {
            expect(result).toEqual({ name: { en: 'Name', ar: 'الاسم' } });
            done();
        });
    });

    it('should return localized string if lang is specified', (done) => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ query: { lang: 'ar' }, headers: {} }),
            }),
        } as unknown as ExecutionContext;

        const next = {
            handle: () => of({ name: { en: 'Name', ar: 'الاسم' } }),
        } as CallHandler;

        interceptor.intercept(context, next).subscribe((result) => {
            expect(result).toEqual({ name: 'الاسم' });
            done();
        });
    });

    it('should fallback to en if requested lang is missing', (done) => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ query: { lang: 'fr' }, headers: {} }),
            }),
        } as unknown as ExecutionContext;

        const next = {
            handle: () => of({ name: { en: 'Name', ar: 'الاسم' } }),
        } as CallHandler;

        interceptor.intercept(context, next).subscribe((result) => {
            expect(result).toEqual({ name: 'Name' });
            done();
        });
    });

    it('should handle nested objects and arrays', (done) => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ query: { lang: 'ar' }, headers: {} }),
            }),
        } as unknown as ExecutionContext;

        const data = {
            title: { en: 'Title', ar: 'العنوان' },
            items: [
                { description: { en: 'Desc 1', ar: 'وصف 1' } },
                { description: { en: 'Desc 2', ar: 'وصف 2' } },
            ],
            meta: {
                seo: { title: { en: 'SEO Title', ar: 'عنوان SEO' } }
            }
        };

        const next = {
            handle: () => of(data),
        } as CallHandler;

        interceptor.intercept(context, next).subscribe((result) => {
            expect(result).toEqual({
                title: 'العنوان',
                items: [
                    { description: 'وصف 1' },
                    { description: 'وصف 2' },
                ],
                meta: {
                    seo: { title: 'عنوان SEO' }
                }
            });
            done();
        });
    });

    it('should handle paginated response structure', (done) => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({ query: { lang: 'ar' }, headers: {} }),
            }),
        } as unknown as ExecutionContext;

        const data = {
            data: [
                { name: { en: 'Product 1', ar: 'منتج 1' } }
            ],
            total: 1,
            page: 1,
            limit: 10
        };

        const next = {
            handle: () => of(data),
        } as CallHandler;

        interceptor.intercept(context, next).subscribe((result) => {
            expect(result).toEqual({
                data: [
                    { name: 'منتج 1' }
                ],
                total: 1,
                page: 1,
                limit: 10
            });
            done();
        });
    });
});
