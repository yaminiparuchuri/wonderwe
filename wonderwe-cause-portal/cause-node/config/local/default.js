module.exports = {
  props: {
    host: "localhost", // "173.194.251.198",
    username: "root",
    password: "scriptbees",
    port: 3306,
    database: "Wonderwe-Pro",
    domain: "http://localhost:3000", //"wonderwe",
    connectionLimit: 200,
    connectTimeout: 50000,
    dbdebug: false,
    redisport: 2367,
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
    loglevel: "warn",
    logtoconsole: false,
    logstashhost: "107.170.170.54",
    environment_type: "local",
    defaultUser_id: 3051,
    defaultCharity_id:1580775,
    fromemail: "WonderWe <noreply@wonderwe.com>",
    fromsupport: "WonderWe <support@wonderwe.com>",
    supportemail:"support@wonderwe.com",
    mandrilkey: "8tzQ1m0N1HwoCGtrPt5qIQ", //"fUbnv1q2xN65AodaXjAKEg",
    claimedCharge: 0.0333,
    unClaimedCharge: 0.0333,
    devmetrics_app_id: "app_id-78146800",
    adminId: 706,
    agendadb: "mongodb://WonderweJobs:WonderweJobsDev@104.236.6.237:27017/wonderwe_jobs",
    agendaJobCollection: "wonderwe_dev_jobs",
    sitemap_config_file: 'config/local/sitemap.json',
    sitemap_url: 'http://localhost:3000',
    elasticServer: "45.55.42.35:57200", //"162.243.11.68:9200",
    elastic_index: 'we_dev',
    agendadomin: "localhost:3006",
    stripe_client_id: "ca_734IAHFS7KgIVaPu4FvVSwbpfQ3XLRIb",
    stripe_secret_key: "sk_test_UA7EMyehCJ9B0rUPxQOjgBee",
    stripe_publishable_key: "pk_test_jz4fV8uIEtMUlTj2guv59vcw",
    stripe_monthly_fee: 3.33,
    stripe_account_id: "acct_16y9jNE9vanzHt10",
    mobileredirect: "https://mdev.wonderwe.com/main.html#",
    shortultapikey: "AIzaSyArcvu2bdwEZpKTRbPF8TWi6boQRQPJstA",
    videoToken: "6b1a159c4d4b32217855178bcb9a2e16",
    intercomAppId: "xi8wwtxz",
    geoserviceid: "110378",
    geoservicekey: "ogK1fOAIu53C",
    analyticsid: "aS6EFcAutvYFtzVsjiVxwyW8TfYZw6uQ",
    facebook_client_id:'1725937031019718',
    facebook_secret_id: '6e22178bb66784390308da87fd666b32',
    default_profile_pic_url:'https://wonderwe.s3.amazonaws.com/profile/4bec27fd-3a06-4b64-8686-6a17edf27a67-img.jpg',
    botId :3051,
    default_org_profile_pic_url:'https://wonderwe.s3.amazonaws.com/profile/10344a9c-068d-4bf5-9454-be11815a51af-default-charitypng.png',
    default_team_profile_pic_url:'https://wonderwe.s3.amazonaws.com/profile/10e9e416-85be-46bc-abd3-90f0c222ecc6-team.png',
    blog:[{"name":"Why a Pro-Life Crowdfunding Site is Needed.","href":"https://blog.wonderwe.com/why-pro-life-crowdfunding-site-needed-%E2%80%93-why-we-need-wonderwe"},
    {"name":"Using crowdfunding for year-end contributions","href":"https://blog.wonderwe.com/using-crowdfunding-year-end-contributions"},
    {"name":"Volunteer-led Crowdfunding.","href":"https://blog.wonderwe.com/how-help-volunteers-create-crowdfunding-campaigns"}]
  }
};
