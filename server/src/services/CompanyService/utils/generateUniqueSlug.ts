import { checkSlugExists } from '../../../repositories/CompanyRepository/index.js';
import { generateSlug } from './generateSlug.js';

/**
 * Generate a unique slug by appending numbers if necessary
 */
export async function generateUniqueSlug(
  name: string,
  excludeCompanyId?: string
): Promise<string> {
  let slug = generateSlug(name);
  let counter = 1;
  let baseSlug = slug;

  while (await checkSlugExists(slug, excludeCompanyId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
