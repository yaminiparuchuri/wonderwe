window.hjSiteSettings = window.hjSiteSettings || {"testers_widgets":[],"polls":[{"persist_condition":"response","targeting":[{"negate":false,"pattern":"http:\/\/www.wonderwe.com\/member\/","match_operation":"starts_with","component":"url"},{"negate":false,"pattern":"tablet","match_operation":"exact","component":"device"},{"negate":false,"pattern":"desktop","match_operation":"exact","component":"device"}],"language":"en","targeting_percentage":100,"created_epoch_time":1441398141,"display_condition":"abandon","content":{"thankyou":"Thank you for answering this Poll. Your feedback is highly appreciated!","questions":[{"nextByAnswer":[],"text":"How can we improve?","labels":null,"answers":[{"text":"Give me more instructions","comments":false},{"text":"Make it easier to find things","comments":false},{"text":"Get more organizations in the app"},{"text":"Other","comments":true}],"next":"byOrder","type":"single-close-ended","randomize_answer_order":false},{"nextByAnswer":[],"text":"What DIDN'T you like our about app?","labels":null,"answers":[{"text":"I don't know what I'm supposed to do","comments":false},{"text":"I don't know how to make a donation","comments":false},{"text":"There's nobody here I'd like to follow"},{"text":"Other","comments":true}],"next":"byOrder","type":"single-close-ended","randomize_answer_order":false},{"nextByAnswer":[],"text":"Would you like a response to your question or comment?","labels":null,"answers":[{"text":"Yes (please enter your email address)","comments":true},{"text":"No thanks","comments":false}],"next":"byOrder","type":"single-close-ended","randomize_answer_order":false}]},"effective_show_branding":true,"background":"#333333","skin":"dark","position":"right","display_delay":0,"id":13419},{"persist_condition":"response","targeting":[{"negate":false,"pattern":"\\\/a\\\/[^\\\/]+","match_operation":"regex","component":"url"},{"negate":false,"pattern":"desktop","match_operation":"exact","component":"device"},{"negate":false,"pattern":"phone","match_operation":"exact","component":"device"},{"negate":false,"pattern":"tablet","match_operation":"exact","component":"device"}],"language":"en","targeting_percentage":100,"created_epoch_time":1441397831,"display_condition":"abandon","content":{"thankyou":"Thank you for answering this Poll. Your feedback is highly appreciated!","questions":[{"nextByAnswer":[],"text":"What are you looking to do?   Help us make it easier for you!","labels":null,"answers":[{"text":"I want to create a crowdfunding campaign","comments":false},{"text":"I want a better social network for our nonprofit","comments":false},{"text":"I want to do a better job marketing and branding our nonprofit"},{"text":"I want to grow our donor base"},{"text":"I want to increase our constituent engagement"},{"text":"I'm just here because someone asked me to take a look"},{"text":"Other","comments":true}],"next":"byOrder","type":"single-close-ended","randomize_answer_order":false},{"nextByAnswer":[],"text":"Please tell us how we can make our site better.","labels":null,"answers":null,"next":"byOrder","type":"single-open-ended-multiple-line","randomize_answer_order":false},{"nextByAnswer":[],"text":"What do you like about our site?","labels":null,"answers":null,"next":"byOrder","type":"single-open-ended-multiple-line","randomize_answer_order":false}]},"effective_show_branding":true,"background":"#333333","skin":"dark","position":"right","display_delay":0,"id":13418}],"recording_capture_keystrokes":true,"site_id":66367,"deferred_page_contents":[],"record_targeting_rules":[],"surveys":[],"heatmaps":[],"feedback_widgets":[],"forms":[{"field_info":[{"field_type":"text","match_value":"firstname","id":127899,"match_attribute":"id"},{"field_type":"text","match_value":"lastname","id":127900,"match_attribute":"id"},{"field_type":"text","match_value":"email","id":127901,"match_attribute":"id"},{"field_type":"password","match_value":"password","id":127902,"match_attribute":"id"},{"field_type":"password","match_value":"confirmpassword","id":127903,"match_attribute":"id"},{"field_type":"checkbox","match_value":"acceptTerms","id":127904,"match_attribute":"id"}],"targeting":[{"negate":false,"pattern":"http:\/\/www.wonderwe.com\/signup\/","match_operation":"simple","component":"url"}],"selector_type":"id","created_epoch_time":1441398955,"selector":"registration","id":13712}],"record":true,"r":1.0};

window.hjBootstrap = window.hjBootstrap || function (scriptUrl) {
    var s = document.createElement('script');
    s.src = scriptUrl;
    document.getElementsByTagName('head')[0].appendChild(s);
    window.hjBootstrap = function() {};
};

hjBootstrap('https://script.hotjar.com/modules-5402cda9a75ea94dccdd3706be701e50.js');