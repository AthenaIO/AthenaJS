/*
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function exit() {
  process.exit();
}

function stop(e) {
  if (e) {
    console.log(e);
  }
  sparkSession.stop().then(exit).catch(exit);
}



function run(sparkSession, spark) {
  return new Promise(function(resolve, reject) {
    var data = [
      spark.sql.RowFactory.create(0.0, "a"),
      spark.sql.RowFactory.create(1.0, "b"),
      spark.sql.RowFactory.create(2.0, "c"),
      spark.sql.RowFactory.create(3.0, "a"),
      spark.sql.RowFactory.create(4.0, "a"),
      spark.sql.RowFactory.create(5.0, "c")
    ];

    var schema = new spark.sql.types.StructType([
      new spark.sql.types.StructField("id", spark.sql.types.DataTypes.DoubleType, false, spark.sql.types.Metadata.empty()),
      new spark.sql.types.StructField("category", spark.sql.types.DataTypes.StringType, false, spark.sql.types.Metadata.empty())
    ]);

    var df = sparkSession.createDataFrame(data, schema);

    var indexer = new spark.ml.feature.StringIndexer()
      .setInputCol("category")
      .setOutputCol("categoryIndex")
      .fit(df);
    var indexed = indexer.transform(df);

    var encoder = new spark.ml.feature.OneHotEncoder()
      .setInputCol("categoryIndex")
      .setOutputCol("categoryVec");
    var encoded = encoder.transform(indexed);
    encoded.select("id", "categoryVec").take(10).then(resolve).catch(reject);
  });
}

if (global.SC) {
  // we are being run as part of a test
  module.exports = run;
} else {
  var eclairjs = require('eclairjs');
  var spark = new eclairjs();
  var sparkSession = spark.sql.SparkSession
            .builder()
            .appName("One Hot Encoder")
            .getOrCreate();

  run(sparkSession, spark).then(function(results) {
    console.log("Result:", JSON.stringify(results));
    stop();
  }).catch(stop);
}
