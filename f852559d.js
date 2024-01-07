import { d as dataFileTypes, D as DataFileType, b as bseDataService } from './4e355c87.js';

class CompanyService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  async companies(filters) {
    const codes = filters.codes || [];
    let conditions = filters.conditions ? ` and ${filters.conditions}` : "";
    let parameters = {};
    if (codes && codes.length) {
      conditions += ` and SecurityCode in (${codes.map(() => "?").join(", ")})`;
      parameters = codes.map(c => Number(c));
    }
    const placeholders = {
      "{{tableName}}": dataFileTypes[DataFileType.Company].tableName,
      "{{conditions}}": conditions,
      "{{orderBy}}": "SecurityCode asc"
    };
    const queryFile = new URL(new URL('8255ff33.sql', import.meta.url).href, import.meta.url).href;
    const results = await bseDataService.executeSelect(queryFile, placeholders, parameters);
    const transformedResults = results.map(r => r);
    return transformedResults;
  }
  static async create() {
    const cRegexString = dataFileTypes[DataFileType.Company].fileRegex.toString();
    const i = cRegexString.indexOf("_");
    const filePrefix = cRegexString.substring(1, i);
    const dataFileQuery = {
      q: `name contains '${filePrefix}_' and mimeType = 'text/csv'`,
      orderBy: "name desc",
      pageSize: 30,
      trashed: false
    };
    await bseDataService.load(dataFileQuery);
    return new CompanyService();
  }
}
const companyService = await CompanyService.create();

export { companyService as default };
