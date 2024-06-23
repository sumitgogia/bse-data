const {
  initSqlJs
} = window;

const apiKey = "AIzaSyDhMh6MVafYcdw3Wd2-VuurVd----eXfyI";
async function initGapi() {
  const {
    gapi: gapi2
  } = window;
  await new Promise(resolve => {
    gapi2.load("client", () => {
      resolve(void 0);
    });
  });
  await gapi2.client.init({
    apiKey,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
  });
  return gapi2;
}
const gapi = await initGapi();
const drive = gapi.client.drive;

const {
  Papa
} = window;
var DataFileType;
(function (DataFileType2) {
  DataFileType2[DataFileType2["Company"] = 0] = "Company";
  DataFileType2[DataFileType2["Announcement"] = 1] = "Announcement";
})(DataFileType || (DataFileType = {}));
const dataFileTypes = {
  [DataFileType.Company]: {
    dft: DataFileType.Company,
    fileRegex: /^companies_(\d{8})\.csv$/,
    tableName: "company",
    getDml(_columnDefs) {
      const columnDefs = _columnDefs.map(cd => /(Group|Index)/.test(cd) ? `"${cd}"` : cd);
      return `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (${columnDefs.join(", ")});
        CREATE UNIQUE INDEX IF NOT EXISTS security_code on ${this.tableName} (SecurityCode);
        `;
    },
    extractDate(fileName) {
      const fm = fileName.match(this.fileRegex);
      return fm != null ? new Date(Number(fm[1].substring(0, 4)), Number(fm[1].substring(4, 2)) - 1, Number(fm[1].substring(6, 2))) : void 0;
    }
  },
  [DataFileType.Announcement]: {
    dft: DataFileType.Announcement,
    fileRegex: /^data_(\d{8})_to_(\d{8})\.csv$/,
    tableName: "announcement",
    getDml(columnDefs) {
      const sColumnDefs = columnDefs.join(", ");
      return `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (${sColumnDefs});
        CREATE INDEX IF NOT EXISTS scrip_cd on ${this.tableName} (SCRIP_CD);
        CREATE INDEX IF NOT EXISTS dissem_dt on ${this.tableName} (DissemDT);
        `;
    },
    extractDate(fileName) {
      const fm = fileName.match(this.fileRegex);
      if (!fm) {
        return void 0;
      }
      const from = new Date(Number(fm[1].substring(0, 4)), Number(fm[1].substring(4, 6)) - 1, Number(fm[1].substring(6, 8)));
      const to = new Date(Number(fm[2].substring(0, 4)), Number(fm[2].substring(4, 6)) - 1, Number(fm[2].substring(6, 8)));
      const date = from.getTime() === to.getTime() ? from : void 0;
      return date;
    }
  }
};
function inferDataType(fileName) {
  return fileName ? Object.values(dataFileTypes).find(dftx => dftx.fileRegex.test(fileName)) : void 0;
}
class BseDataService {
  // eslint-disable-next-line no-useless-constructor, no-empty-function
  constructor(db) {
    this.db = db;
    this.myDateFormatter = new Intl.DateTimeFormat("fr-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    this.fileMetaByDft = Object.fromEntries(Object.keys(DataFileType).filter(dft => !Number.isNaN(dft)).map(dft => [Number(dft), {}]));
  }
  get dataFilesInfoById() {
    const fileInfosById = {};
    Object.values(this.fileMetaByDft).forEach(v => {
      Object.values(v).forEach(o => {
        const f = o.file;
        fileInfosById[f.id] = f;
      });
    });
    return fileInfosById;
  }
  isLoaded(dft, date) {
    var _a, _b;
    return !!((_b = (_a = this.fileMetaByDft[dft][date.toLocaleDateString()]) === null || _a === void 0 ? void 0 : _a.file) === null || _b === void 0 ? void 0 : _b.inDB);
  }
  static async fetchQueryFileAndUpdatePlaceholders(queryFile, placeholders) {
    return fetch(queryFile).then(r => r.text()).then(_q => {
      let q = _q;
      Object.entries(placeholders).forEach(([key, value]) => {
        q = q.replace(new RegExp(key, "g"), value);
      });
      return q;
    });
  }
  async executeQuery(queryFile, placeholders, parameters) {
    return BseDataService.fetchQueryFileAndUpdatePlaceholders(queryFile, placeholders).then(q => this.db.exec(q, parameters));
  }
  async executeSelect(queryFile, placeholders, parameters) {
    return BseDataService.fetchQueryFileAndUpdatePlaceholders(queryFile, placeholders).then(q => {
      const results = [];
      this.db.each(q, parameters, row => results.push({
        ...row
      }), () => {});
      return results;
    });
  }
  // Load CSV data using Papa Parse and return a Promise (so await syntax can be used by the caller)
  parseCsv(driveFileId, stepFn) {
    let lastErrors;
    let rowCount = 0;
    return new Promise((resolve, reject) => {
      drive.files.get({
        fileId: driveFileId,
        alt: "media"
      }).then(response => response.body).then(content => {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          chunk: results => {
            try {
              const {
                data,
                errors
              } = results;
              lastErrors = errors;
              if (data) {
                rowCount += data.length;
                stepFn(data);
              }
            } catch (error) {
              reject(error);
            }
          },
          complete: r => {
            const fName = this.dataFilesInfoById[driveFileId].name;
            let errorMsg;
            if (lastErrors === null || lastErrors === void 0 ? void 0 : lastErrors.length) {
              errorMsg =
              // eslint-disable-next-line prefer-template
              lastErrors.length + " Parsing errors reported for (" + fName + "):\nErrors: " + JSON.stringify(lastErrors);
              console.warn(errorMsg);
            }
            console.info(`${fName}: ${rowCount} rows parsed.`);
            return resolve(r);
          },
          error: error => reject(error)
        });
      });
    });
  }
  async fetchFilesMetaFromDrive(_query) {
    var _a;
    const query = {
      ..._query
    };
    const folderId = "1tee0Dxdu8hT_V3psEKCQxnd5cqTz3Pkv";
    query.q = `'${folderId}' in parents and ${query.q}`;
    const response = await drive.files.list(query);
    const files = (_a = response === null || response === void 0 ? void 0 : response.result) === null || _a === void 0 ? void 0 : _a.files;
    const lastFetched = /* @__PURE__ */new Date();
    const fileMetas = [];
    files.forEach(f => {
      var _a2;
      const dftx = inferDataType(f.name);
      if (!dftx) {
        console.error(`Ignoring fetched meta for file : ${f.name}, as it's (data) file type is not known`);
        return;
      }
      const date = dftx.extractDate(f.name);
      if (!date) {
        console.error(`Ignoring fetched meta for file : ${f.name}, as it's date marker(s) is undefined`);
        return;
      }
      const dftMetaByDate = this.fileMetaByDft[dftx.dft];
      const dateString = date.toLocaleDateString();
      dftMetaByDate[dateString] = dftMetaByDate[dateString] || {};
      const fileMeta = dftMetaByDate[dateString];
      const inDB = (_a2 = fileMeta.file) === null || _a2 === void 0 ? void 0 : _a2.inDB;
      const {
        dft
      } = dftx;
      fileMeta.file = {
        id: f.id || "",
        name: f.name || "",
        date,
        dft,
        inDB
      };
      fileMeta.lastFetched = lastFetched;
      fileMetas.push(fileMeta.file);
    });
    return fileMetas;
  }
  createTable(dftx, columns) {
    const dml = dftx.getDml(columns);
    this.db.run(dml);
  }
  async fetchDataAndFillDB(fileInfo) {
    const {
      id,
      dft
    } = fileInfo;
    const dftx = dft !== void 0 ? dataFileTypes[dft] : void 0;
    if (!dftx) {
      throw new Error("Unknown data file type");
    }
    let statement;
    let columns;
    try {
      await this.parseCsv(id, _data => {
        const tableName = dftx === null || dftx === void 0 ? void 0 : dftx.tableName;
        const data = Array.isArray(_data) ? _data : [_data];
        if (!columns) {
          const d1 = data[0];
          columns = Object.keys(d1);
          const columnPlaceholders = columns.map(c => `:${c}`).join(",");
          this.createTable(dftx, columns);
          statement = this.db.prepare(`INSERT INTO ${tableName} VALUES (${columnPlaceholders})`);
        }
        try {
          this.db.exec("BEGIN TRANSACTION");
          data.forEach(row => {
            const transformedEntries = Object.entries(row).map(([k, v]) => [`:${k}`, v]);
            const tRow = Object.fromEntries(transformedEntries);
            statement === null || statement === void 0 ? void 0 : statement.run(tRow);
          });
          this.db.exec("COMMIT");
        } catch (error) {
          this.db.exec("ROLLBACK");
          throw error;
        }
        this.dataFilesInfoById[id].inDB = true;
      });
      return fileInfo;
    } finally {
      statement === null || statement === void 0 ? void 0 : statement.free();
    }
  }
  // eslint-disable-next-line camelcase
  async load(query) {
    let files = await this.fetchFilesMetaFromDrive(query);
    const promises = files.filter(fileInfo => !fileInfo.inDB && fileInfo.dft !== void 0).map(async fileInfo => this.fetchDataAndFillDB(fileInfo));
    files = await Promise.all(promises);
    return files;
  }
  static async create() {
    const sqlJsVersion = "1.8.0";
    const SQL = await initSqlJs({
      locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${sqlJsVersion}/${filename}`
    });
    const db = new SQL.Database();
    return new BseDataService(db);
  }
}
const bseDataService = await BseDataService.create();

export { DataFileType as D, bseDataService as b, dataFileTypes as d };
