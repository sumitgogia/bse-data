import { D as DateTime } from './0924aaa9.js';
import { d as dataFileTypes, D as DataFileType, b as bseDataService } from './4e355c87.js';
import './c0d85e7c.js';
import './c5e81f2c.js';

class AnnouncementService {
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
    const today = DateTime.now();
    const startDate = DateTime.fromJSDate(dateRange.from || today.startOf("day").toJSDate());
    const endDate = DateTime.fromJSDate(dateRange.to || today.endOf("day").toJSDate());
    const dates = [];
    let noData = true;
    for (let date = startDate.startOf("day"); date <= endDate; date = date.plus({
      day: 1
    }).startOf("day")) {
      if (!bseDataService.isLoaded(DataFileType.Announcement, date.toJSDate())) {
        dates.push(date);
      } else {
        noData = false;
      }
    }
    const formatter = bseDataService.myDateFormatter;
    if (dates.length) {
      const q = dates.map(d => `(name contains '${formatter.format(d.toJSDate()).replace(/-/g, "")}')`).join(" or ");
      const dataFileQuery = {
        q: await AnnouncementService.withBaseQueryPrefix(`(${q})`),
        orderBy: "name desc",
        trashed: false
      };
      await bseDataService.load(dataFileQuery);
      noData = noData && !dates.find(d => bseDataService.isLoaded(DataFileType.Announcement, d.toJSDate()));
    }
    if (noData) {
      return [];
    }
    const parameters = {
      $from: startDate.setZone("utc", {
        keepLocalTime: true
      }).toUnixInteger() - 1,
      $to: endDate.setZone("utc", {
        keepLocalTime: true
      }).toUnixInteger() + 1
    };
    const placeholders = {
      "{{tableName}}": dataFileTypes[DataFileType.Announcement].tableName,
      "{{conditions}}": `and (unixepoch(DissemDT) > $from and unixepoch(DissemDT) < $to)`
    };
    const queryFile = new URL(new URL('4934b340.sql', import.meta.url).href, import.meta.url).href;
    const result = await bseDataService.executeQuery(queryFile, placeholders, parameters);
    return result;
  }
  static async create() {
    return new AnnouncementService();
  }
}
const announcementService = await AnnouncementService.create();

export { announcementService as default };
