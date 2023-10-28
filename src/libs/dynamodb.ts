import { DynamoDB } from "aws-sdk";

const dynamoDB = new DynamoDB.DocumentClient();

export default dynamoDB;