import { S3 } from "aws-sdk";

const s3 = new S3();

const Bucket = process.env.TABLEAU_REPORTS_BUCKET;

export const getObjectsFromFolder = async (folderName: string, emptyReportSize: number = 280) => {
  const params = {
    Bucket,
    Prefix: folderName
  };

  const data = await s3.listObjectsV2(params).promise();

  const files = await Promise.all(data.Contents.map(async (file) => {
    const getObjectParams = {
      Bucket,
      Key: file.Key
    };

    const fileData = await s3.getObject(getObjectParams).promise();

    const fileSize = fileData.ContentLength;

    if (fileSize > emptyReportSize * 1024) { // 280KB
      return {
        name: file.Key,
        lastModified: file.LastModified,
        file: fileData.Body
      };
    } else {
      return null;
    }
  }));

  return files.filter(file => file !== null);
};


export const getObjectsFromKeys = async (keys: string[], emptyReportSize: number = 280) => {
  const files = await Promise.all(keys.map(async (key) => {
    const getObjectParams = {
      Bucket,
      Key: key
    };

    const fileData = await s3.getObject(getObjectParams).promise();

    const fileSize = fileData.ContentLength;

    if (fileSize > emptyReportSize * 1024) { // 280KB
      return {
        name: key,
        lastModified: fileData.LastModified,
        file: fileData.Body
      };
    } else {
      return null;
    }
  }));

  return files.filter(file => file !== null);
};

export const listCompaniesFromBucket = async () => {
  const params = {
    Bucket,
    Delimiter: '/',
  };
  const s3Keys = await s3.listObjectsV2(params).promise();
  const companies = s3Keys.CommonPrefixes.map(company => company.Prefix.split('/')[0]);
  return companies;
}

export const listReportsByCompany = async (company: string) => {
  const params = {
    Bucket,
    Prefix: `${company}/`
  };
  const s3Keys = await s3.listObjectsV2(params).promise();
  const reports = [];
  s3Keys.Contents.forEach(report => {
    if (report.Key !== `${company}/`) reports.push(report.Key.split('/')[1]);
  });
  return reports;
}

