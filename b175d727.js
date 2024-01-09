import { d as dataFileTypes, D as DataFileType, b as bseDataService } from './4e355c87.js';

class AnnouncementService {
  // eslint-disable-next-line no-useless-constructor, no-empty-function
  constructor() {}
  static async withBaseQueryPrefix(query) {
    const annRegexString = dataFileTypes[DataFileType.Announcement].fileRegex.toString();
    const i = annRegexString.indexOf("_");
    const filePrefix = annRegexString.substring(1, i);
    const q = `name contains '${filePrefix}_' and mimeType = 'text/csv' and ${query}`;
    return q;
  }
  // eslint-disable-next-line class-methods-use-this
  async announcements(filters) {
    const dateRange = filters.dateRange || {};
    const today = /* @__PURE__ */new Date();
    const startDate = new Date((dateRange.from || today).toDateString());
    const endDate = new Date((dateRange.to || today).toDateString());
    const dates = [];
    let noData = true;
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      if (!bseDataService.isLoaded(DataFileType.Announcement, date)) {
        dates.push(new Date(date));
      } else {
        noData = false;
      }
    }
    const formatter = bseDataService.myDateFormatter;
    if (dates.length) {
      const q = dates.map(d => `(name contains '${formatter.format(d).replace(/-/g, "")}')`).join(" or ");
      const dataFileQuery = {
        q: await AnnouncementService.withBaseQueryPrefix(`(${q})`),
        orderBy: "name desc",
        trashed: false
      };
      await bseDataService.load(dataFileQuery);
      noData = noData && !dates.find(d => bseDataService.isLoaded(DataFileType.Announcement, d));
    }
    if (noData) {
      return [];
    }
    const parameters = {
      $from: formatter.format(startDate),
      $to: formatter.format(endDate)
    };
    const placeholders = {
      "{{tableName}}": dataFileTypes[DataFileType.Announcement].tableName,
      "{{conditions}}": `and Date(DissemDT) >= $from and Date(DissemDT) <= $to`
    };
    const queryFile = new URL(new URL('d981246d.sql', import.meta.url).href, import.meta.url).href;
    const result = await bseDataService.executeQuery(queryFile, placeholders, parameters);
    return result;
  }
  static async create() {
    return new AnnouncementService();
  }
}
const announcementService = await AnnouncementService.create();

export { announcementService as default };
