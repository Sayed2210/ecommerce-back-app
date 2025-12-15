import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const lang = request.query.lang || request.headers['accept-language'];

        return next.handle().pipe(
            map((data) => {
                if (!lang) {
                    return data;
                }
                // Use the first part of the language code (e.g., 'en' from 'en-US')
                const cleanLang = lang.split('-')[0].split(',')[0];
                return this.transformResponse(data, cleanLang);
            }),
        );
    }

    private transformResponse(data: any, lang: string): any {
        if (!data) {
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.transformResponse(item, lang));
        }

        if (typeof data === 'object' && data !== null) {
            // Check if it's a paginated response
            if (data.data && Array.isArray(data.data) && data.total !== undefined) {
                return {
                    ...data,
                    data: this.transformResponse(data.data, lang),
                };
            }

            // Check if the object is a translation object (has 'en' key and maybe others)
            // This is a heuristic: if it has 'en' and the requested lang, or just 'en' and we want a string.
            // Adjusting heuristic: strictly check if it looks like a translation map.
            // Assuming translation maps are like { en: "...", ar: "..." }
            // We can check if `en` exists and is a string.
            if (this.isTranslationObject(data)) {
                return data[lang] || data['en'] || data;
            }

            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = this.transformResponse(data[key], lang);
                }
            }
            return newData;
        }

        return data;
    }

    private isTranslationObject(obj: any): boolean {
        // Simple check: must have 'en' key and values should be strings
        // You might want to make this more robust depending on your schema
        return (
            typeof obj === 'object' &&
            obj !== null &&
            'en' in obj &&
            typeof obj.en === 'string'
        );
    }
}
