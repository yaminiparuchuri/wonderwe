module.exports = {
  props: {
    host: "104.236.69.222", // "173.194.251.198",
    username: "root",
    password: "scriptbees1$",
    database: "wonderwe_auto",
    domain: "https://auto.wonderwe.com",
    dbdebug: false,
    connectionLimit: 500,
    connectTimeout: 50000,
    redisport: 6379,
    redishost: '45.55.131.241',
    redispass: 'sbwe@2013',
    cloudurl: "https://wonderwe.s3.amazonaws.com/",
    cloudAccessKey: "AKIAITPV5X4X2BWSCQUA",
    cloudSecretKey: "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",
    cloudProvide: "amazon",
    thumbor: "http://thumbor.scriptbees.com/unsafe/",
    sp_uname: "trinesh@wonderwe.com", //"volunteermark",
    sp_pass: "8tzQ1m0N1HwoCGtrPt5qIQ", //"fUbnv1q2xN65AodaXjAKEg", //"vmark123",
    mailservice: "Mandrill", //"sendgrid",
    client_id: "121705", // test mode
    client_secret: "963f864c20",
    account_id: "592540516",
    access_token: "STAGE_62f9106181b3bf263b12e61ed29c50800237ed72b02d8c0a931e42b2208a04f6",
    //  access_token : "STAGE_4f60e0fc5d275c401ca99ec51cef7a3827859bf16b0a940d238f25d2562896ec",
    //  account_id :"73865475",
    environment_type: "qa",
    loglevel: "warn",
    logtoconsole: false,
    logstashhost: "107.170.170.54",
    fromemail: "WonderWe <noreply@wonderwe.com>",
    fromsupport: "WonderWe <support@wonderwe.com>",
    supportemail:"support@wonderwe.com",
    mandrilkey: "8tzQ1m0N1HwoCGtrPt5qIQ", //"fUbnv1q2xN65AodaXjAKEg", //"Iknb0j4PxLkI2DxGG02UiA",
    claimedCharge: 0.0333,
    unClaimedCharge: 0.0333,
    devmetrics_app_id: "app_id-78146800",
    adminId: 706,
    agendadb: "mongodb://WonderweJobs:WonderweJobsDev@104.236.6.237:27017/wonderwe_jobs",
    agendaJobCollection: "wonderwe_auto",
    elasticServer: "45.55.42.35:9200", //"162.243.11.68:9200",
    elasticsearchlog: "error",
    elastic_index: 'we_auto',
    agendadomin: "jobs-auto.wonderwe.com",
    stripe_client_id: "ca_7CY8RsoDEV9ojwruXDWrWtfluzD8WqP6", //"ca_734IAHFS7KgIVaPu4FvVSwbpfQ3XLRIb",
    stripe_secret_key: "sk_test_9He0ExVUKr2U3ocvMV6XsgnP", //"sk_test_UA7EMyehCJ9B0rUPxQOjgBee",
    stripe_publishable_key: "pk_test_NHcIAsYe0nhZnL0SalUDOHhe", //"pk_test_jz4fV8uIEtMUlTj2guv59vcw",
    stripe_monthly_fee: 3.33,
    stripe_account_id: "acct_16y9jNE9vanzHt10",
    mobileredirect: "https://mauto.wonderwe.com/main.html#",
    shortultapikey: "AIzaSyArcvu2bdwEZpKTRbPF8TWi6boQRQPJstA",
    videoToken: "6b1a159c4d4b32217855178bcb9a2e16",
    intercomAppId: "xi8wwtxz",
    geoserviceid: "110378",
    geoservicekey: "ogK1fOAIu53C",
    analyticsid: "aS6EFcAutvYFtzVsjiVxwyW8TfYZw6uQ",
    blog:[{"name":"Manage Your Emergency! The WonderWe Team Will Handle Your Online Donations!","href":"https://blog.wonderwe.com/manage-your-emergency-wonderwe-team-will-handle-your-online-donations"},
    {"name":"Using crowdfunding for year-end contributions","href":"https://blog.wonderwe.com/using-crowdfunding-year-end-contributions"},
    {"name":"'Tis the season for Crowdfunding","href":"https://blog.wonderwe.com/tis-season-crowdfunding"}]
  }
};
