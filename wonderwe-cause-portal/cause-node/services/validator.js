var validate = require("validate.js");
var sanitizeHtml = require('sanitize-html');
validate.validators.sanitizeDescription = function(value, options, key, attributes) {
  if (value.indexOf("onerror") >= 0 || value.indexOf("&lt;script&gt;") >= 0 || value.indexOf("<script>") >= 0) {
    return " does not allow special characters"
  } else {
    return null;
  }
};
validate.validators.sanitizePassword = function(value, options, key, attributes) {
  if (value) {
    var valid = value.replace(/\&/g, "&amp;");
    valid = valid.replace(/\"/g, "&quot;");
    var val = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: []
    });
    if (valid === val) {
      return null;
    } else {
      if (options.message) {
        return options.message;
      } else {
        return "does not allow thetse two special characters '<' and '>'";
      }
    }
  } else {
    return null;
  }
};
validate.validators.sanitizeAll = function(value, options, key, attributes) {
  if (value) {
    var valid = value.replace(/\ /g, '%20');
    valid = valid.replace(/\'/g, '%27');
    var val = escape(sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: []
    }));
    if (valid === val) {
      return null;
    } else {
      if (options.message) {
        return options.message;
      } else {
        return "does not allow special characters";
      }
    }
  } else {
    return null;
  }
};
module.exports = (function() {

  function login(obj, callback) {
    var signInSchema = {
      email: {
        presence: {
          message: "is required"
        },
        email: {
          message: "should be a valid email",
        }
      },
      password: {
        presence: {
          message: 'is required'
        }
      }
    };
    //callback(validate(obj, signInSchema));
    var errorObject = validate(obj, signInSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function changePassword(obj, callback) {

    var changePasswordContain = {
      confirmPassword: {
        equality: "password"
      }
    };
    callback(validate(obj, changePasswordContain));
  }

  function userRegistration(obj, callback) {


    var registerSchema = {
      email: {
        presence: {
          message: "is required"
        },
        email: {
          message: "^Please enter a valid email"
        },
        length: {
          maximum: 255
        },
        sanitizeAll: true
      },
      password: {
        presence: {
          message: 'is required'
        },
        length: {
          minimum: 6,
          maximum: 255
        },
        sanitizePassword: true
      },
      firstname: {
        presence: {
          message: 'is required'
        },
        length: {

          maximum: 100
        },
        sanitizeAll: {
          message: "^First Name does not allow special characters"
        }
      },
      lastname: {
        presence: {
          message: 'is required'
        },
        length: {
          maximum: 99
        },
        sanitizeAll: {
          message: "^Last Name does not allow special characters"
        }
      }
    };
    //callback(validate(obj, registerSchema));
    var errorObject = validate(obj, registerSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function paramExistsAndNumber(obj, callback) {

    var existsAndANumberSchema = {
      charityId: {
        presence: {
          message: " is required"
        },
        numericality: {
          onlyInteger: true
        }
      },
      email: {
        email: {
          message: "This is not a valid email address"
        },
        length: {
          minimum: 10,
          maximum: 100
        }
      },
      phone: {
        numericality: {
          onlyInteger: true
        },
        length: {
          minimum: 10,
          maximum: 16
        }
      },
      // postal_code: {
      //   numericality: {
      //     onlyInteger: true
      //   },
      //   length: {
      //     minimum: 5,
      //     maximum: 10
      //   }
      // },
      address_1: {
        length: {
          maximum: 200
        }
      },
      address_2: {
        length: {
          maximum: 200
        }
      }
    };
    //callback(validate(obj, existsAndANumberSchema));
    var errorObject = validate(obj, existsAndANumberSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function paramExistsAndNumberSer(obj, callback) {
    var existsAndANumberSchema = {
      charityId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, existsAndANumberSchema));
    var errorObject = validate(obj, existsAndANumberSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function validateCategory(obj, callback) {
    //TODO: Add the Validations
    callback(null);
    /*
     var errorObject = validate(obj, existsAndANumberSchema);
     if (errorObject) {
     errorObject.flag = 400;
     }
     callback(errorObject);*/

  }

  function validateCharityAdmin(adminObj, callback) {

    var addAdmin = {
      charity_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      user_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      can_post: {
        presence: true
      },
      can_update_financial: {
        presence: true
      },
      /*
       can_request_withdrawal : {
       presence : true
       },*/

      can_view_reports: {
        presence: true
      },
      can_code: {
        presence: true
      },
      can_manage_followers: {
        presence: true
      },
      can_admin: {
        presence: true
      }

    };

    //callback(validate(adminObj, addAdmin));
    var errorObject = validate(adminObj, addAdmin);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function paramUserExistsAndNumber(userId, callback) {

    var existsAndANumberSchema = {
      userId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, existsAndANumberSchema));
    var errorObject = validate(userId, existsAndANumberSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function paramAdminUserExistsAndNumber(obj, callback) {
    var existsAndANumberSchema = {
      charityAdminId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, existsAndANumberSchema));
    var errorObject = validate(obj, existsAndANumberSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function existsCategoryAndNumber(obj, callback) {
    var existsAndANumberSchema = {
      categoryId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, existsAndANumberSchema));

    var errorObject = validate(obj, existsAndANumberSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function validateCreateCode(obj, callback) {
    try {
      var codeSchema = {
        user_id: {
          presence: true,
          numericality: {
            onlyInteger: true
          }
        },
        code_text: {
          presence: true,
          length: {
            minimum: 4,
            maximum: 15
          }
        },
        title: {
          presence: true,
          length: {
            minimum: 4,
            maximum: 45
          }
        },
        description: {
          presence: true
        },
        code_picture_url: {
          presence: true
        },
        goal: {
          presence: true,
          numericality: {
            onlyInteger: false,
            greaterThan: 0,
            lessThanOrEqualTo: 99999999.99
          }
        },
        category_id: {
          presence: true,
          numericality: {
            onlyInteger: true
          }
        },
        suggested_donation: {
          presence: false,
          numericality: {
            onlyInteger: false,
            lessThanOrEqualTo: 99999999.99
          }
        },
        code_video_url: {
          presence: false,
          length: {
            maximum: 255
          }
        },
        beneficiary: {
          presence: false,
          length: {
            maximum: 255
          }
        },
        charity_id: {
          presence: false,
          numericality: {
            onlyInteger: true
          }
        },
        thank_message: {
          sanitizeDescription: true,
          presence: false
        }
      };
      console.log('In the obj', obj);
      //callback(validate(obj, codeSchema));

      console.log(obj);
      var errorObject = validate(obj, codeSchema);
      if (errorObject) {
        commonValidationObjectConstructor(errorObject, callback);
      } else {
        callback(null);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function commonParamExistsAndNumber(id, callback) {
    var existsAndANumberSchema = {
      id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    /*
     callback(validate({
     id : id
     }, existsAndANumberSchema));*/

    var errorObject = validate({
      id: id
    }, existsAndANumberSchema);
    if (errorObject) {

      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function commonParamExistsAndString(id, callback) {
    var existsAndANumberSchema = {
      id: {
        presence: true
      }
    };
    /*
     callback(validate({
     id : id
     }, existsAndANumberSchema));*/
    var errorObject = validate({
      id: id
    }, existsAndANumberSchema);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function validateEmailLength(id, callback) {
    console.log("id");
    console.log("sdvalidator");
    console.log(id);
    var existsAndANumberSchema = {
      id: {
        presence: true,
        length:{
          maximum:5
        }
      }
    };
    /*
     callback(validate({
     id : id
     }, existsAndANumberSchema));*/
    var errorObject = validate({
      id: id
    }, existsAndANumberSchema);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }


  function postFeed(feedObj, callback) {
    var postFeedSchema = {
      entity_id: {
        presence: true
      },
      ip_address: {
        presence: true
      },
      city: {
        presence: true
      },
      state: {
        presence: true
      },
      content: {
        presence: true
      },
      status_type: {
        presence: true
      }
    };

    //callback(validate(feedObj, postFeedSchema));
    var errorObject = validate(feedObj, postFeedSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);

    } else {
      callback(null);
    }
  }

  function validateCodeId(obj, callback) {
    var charityCodeIdSchema = {
      codeId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, charityCodeIdSchema));
    var errorObject = validate(obj, charityCodeIdSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function fundraiseCodeUpdate(obj, callback) {

    var updatefundraiseCategoryCodeSchema = {
      category_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      code_text: {
        presence: true,
        length: {
          minimum: 4,
          maximum: 15
        }
      },
      title: {
        presence: true,
        length: {
          minimum: 4,
          maximum: 45
        }
      },
      description: {
        presence: true
      },
      code_picture_url: {
        presence: true,
        length: {
          maximum: 255
        }
      },
      goal: {
        presence: true,
        numericality: {
          onlyInteger: false,
          greaterThan: 0,
          lessThanOrEqualTo: 99999999.99
        }
      },
      user_id: {
        presence: true
      },
      suggested_donation: {
        presence: false,
        numericality: {
          onlyInteger: false,
          lessThanOrEqualTo: 99999999.99
        }
      },
      code_video_url: {
        presence: false,
        length: {
          maximum: 255
        }
      },
      beneficiary: {
        presence: false,
        length: {
          maximum: 255
        }
      },
      charity_id: {
        presence: false,
        numericality: {
          onlyInteger: true
        }
      }
    };

    //callback(validate(obj, updateCategoryCodeSchema));
    var errorObject = validate(obj, updatefundraiseCategoryCodeSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function updateCharityCategoryCode(obj, callback) {
    var updateCategoryCodeSchema = {
      category_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      code_text: {
        presence: true,
        length: {
          minimum: 4,
          maximum: 15
        },
        sanitizeAll: {
          message: "^WE#code does not allow special characters"
        }
      },
      title: {
        presence: true,
        length: {
          minimum: 4,
          maximum: 45
        },
        sanitizeAll: {
          message: "^Campaign Name does not allow special characters"
        }
      },
      description: {
        presence: true,
        sanitizeDescription: true
      },
      code_picture_url: {
        presence: true,
        length: {
          maximum: 255
        }
      },
      goal: {
        presence: true,
        numericality: {
          onlyInteger: false,
          greaterThan: 0,
          lessThanOrEqualTo: 99999999.99
        }
      },
      user_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      suggested_donation: {
        presence: false,
        numericality: {
          onlyInteger: false,
          lessThanOrEqualTo: 99999999.99
        }
      },
      code_video_url: {
        presence: false,
        length: {
          maximum: 255
        }
      },
      beneficiary: {
        presence: false,
        length: {
          maximum: 255
        },
        sanitizeAll: true
      },
      charity_id: {
        presence: false,
        numericality: {
          onlyInteger: true
        }
      },
      thank_message: {
        sanitizeDescription: true
      }
    };

    //callback(validate(obj, updateCategoryCodeSchema));
    var errorObject = validate(obj, updateCategoryCodeSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateTransactions(obj, callback) {
    var transactionSchema = {
      startDate: {
        presence: true
      },
      endDate: {
        presence: true
      },
      charityId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, transactionSchema));
    var errorObject = validate(obj, transactionSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateStatistics(obj, callback) {
    var statisticsSchema = {
      charityId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    //callback(validate(obj, statisticsSchema));
    var errorObject = validate(obj, statisticsSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateCharityProfile(obj, callback) {
    var charityProfile = {
      charityId: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },
      full_description: {
        presence: {
          message: "is required"
        },
        length: {
          minimum: 20,
          maximum: 500
        },
        sanitizeDescription: true
      },
      web_url: {
        presence: {
          message: "is required"
        },
        length: {
          maximum: 255
        }
      },
      profile_pic_url: {
        presence: {
          message: "is required"
        },
        length: {
          maximum: 255
        }
      }
    };

    //callback(validate(obj, charityProfile));
    var errorObject = validate(obj, charityProfile);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function paramCodeId(obj, callback) {
    var existsAndANumber = {
      codeId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };

    var errorObject = validate(obj, existsAndANumber);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateUserId(obj, callback) {

    var settings = {

      userId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };

    var errorObject = validate(obj, settings);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }

  }

  function validateUserIdAndEmailId(obj, callback) {

    var settings = {

      userId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },

      emailid: {

        presence: true
      }
    };

    var errorObject = validate(obj, settings);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateOrg(obj, callback) {

    var settings = {

      orgName: {
        presence: true
      }
    };

    var errorObject = validate(obj, settings);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validatePostCategorys(obj, callback) {
    async.each(obj, function(object, callback) {
      var existsAndANumber = {
        category_id: {
          presence: true,
          numericality: {
            onlyInteger: true
          }
        },
        charity_id: {
          presence: true,
          numericality: {
            onlyInteger: true
          }
        }
      };
      callback(null, existsAndANumber);
    }, function(err, existsAndANumber) {
      if (err) {
        callback1(err);
      } else {
        //callback(validate(obj, existsAndANumber));
        var errorObject = validate(obj, existsAndANumber);
        if (errorObject) {
          commonValidationObjectConstructor(errorObject, callback);
        } else {
          callback(null);
        }
      }

    });
  }

  function validateUploadProfileObj(obj, callback) {
    var existsAndANumber = {
      orgId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      profile_pic_url: {
        presence: true

      },
      profile_pic_thumb_url: {
        presence: true

      }
    };
    //callback(validate(obj, existsAndANumber));
    var errorObject = validate(obj, existsAndANumber);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }

  }

  function verifyUserId(obj, callback) {
    var userIdVerification = {
      userid: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    var errorObject = validate(obj, userIdVerification);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function transInfoOfDates(obj, callback) {
    var userIdVerification = {
      charityId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      fromDate: {
        presence: true
      },
      toDate: {
        presence: true
      },
    };
    var errorObject = validate(obj, userIdVerification);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function transYearInfo(obj, callback) {
    var userIdVerification = {
      charityId: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      },
      year: {
        presence: true
      }
    };
    var errorObject = validate(obj, userIdVerification);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function accountDetailsValidate(obj, callback) {
    var accountDetailsVerify = {
      id: {
        presence: {
          message: "is required"
        },
        numericality: {
          onlyInteger: true
        }
      },
      email: {
        presence: {
          message: "^Please enter a valid email"
        },
        email: true,
        email: {
          message: "^Please enter a valid email",
          length: {
            maximum: 255
          }
        },
        sanitizeAll: true
      },
      codeimage: {
        length: {
          maximum: 255
        }
      },
      donor_image: {
        length: {
          maximum: 255
        }
      },
      name: {
        presence: true,
        length: {
          maximum: 200
        },
        sanitizeAll: true
      },
      about_me: {
        presence: true,
        sanitizeDescription: {
          message: "^Description  does not allow special characters"
        }
      },
      address_1: {
        length: {
          minimum: 3,
          maximum: 200
        },
        sanitizePassword: true
      },
      address_2: {
        length: {
          minimum: 3,
          maximum: 200
        },
        sanitizePassword: true
      },
      country: {
        numericality: {
          onlyInteger: true
        }
      },
      state: {
        numericality: {
          onlyInteger: true
        }
      },
      city: {
        length: {
          maximum: 200
        }
      },
      zipcode: {
        numericality: {
          onlyInteger: true
        }
      },
      phone: {
        length: {
          minimum: 10,
          maximum: 20
        }
      },
      gender: {
        inclusion: {
          within: ['male', 'female'],
          message: "is not selected in list"
        }
      },
      relationship: {
        inclusion: ['single', 'married', 'divorced', 'widowed', 'relationship']
      },
      religious_affiliation: {
        inclusion: ['catholic', 'protestant', 'mormon', 'christian-other', 'jewish', 'muslim', 'hindu', 'buddhist', 'atheist', 'agnostic', 'other']
      },
      timezone: {
        numericality: {
          onlyInteger: true
        }
      },
    };
    var errorObject = validate(obj, accountDetailsVerify);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function activeYearSummary(obj, callback) {
    var summaryYearly = {
      charityId: {
        presence: true
      }
    };
    var errorObject = validate(obj, summaryYearly);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function updatePostValidation(obj, callback) {
    var updatefeed = {
      content: {
        presence: true
      },
      update_id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    var errorObject = validate(obj, updatefeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }

  }

  function validateYear(obj, callback) {
    var updatefeed = {
      charityId: {
        presence: true
      }
      /*  year : {
       presence : true

       }*/
    };
    var errorObject = validate(obj, updatefeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function validateVerificationKey(obj, callback) {
    var updatefeed = {
      verification_key: {
        presence: true

      }
    };
    var errorObject = validate(obj, updatefeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function checkEmailValidate(obj, callback) {
    var updatefeed = {
      email: {
        presence: {
          message: "^Please enter a valid email"
        },
        email: true,
        email: {
          message: "^Please enter a valid email",
          length: {
            maximum: 255
          }
        },
        sanitizeAll: true
      },
    };
    var errorObject = validate(obj, updatefeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function changePasswordValidate(obj, callback) {
    var updatefeed = {
      currentPassword: {
        presence: true
      },
      newPassword: {
        presence: true,
        length: {
          maximum: 255
        },
        sanitizePassword: true
      },
      verifyPassword: {
        length: {
          maximum: 255
        },
        equality: "newPassword"
      },
      id: {
        presence: true,
        numericality: {
          onlyInteger: true
        }
      }
    };
    var errorObject = validate(obj, updatefeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function mentionsentityId(entityId, callback) {
    var mentionsFeed = {
      charityId: {
        presence: true
      }
    };
    var errorObject = validate(obj, mentionsFeed);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function campaignCodeVaidation(obj, callback) {

    var updatefeed = {
      code_text: {
        presence: true
      },
      typeOfMode: {
        presence: true
      }
    };
    var errorObject = validate(obj, updatefeed);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }

  }

  function mentionsPostId(postId, callback) {

    var mentionsPostId = {
      postId: {
        presence: true
      }
    };
    var errorObject = validate(obj, mentionsPostId);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }



  function onetimeDonation(donationObj, callback) {

    var onetimeDOnationSchema = {

      charity_id: {
        presence: true
      },
      amount: {
        presence: true
      },
      credit_card_id: {
        presence: true
      }
    };
    var errorObject = validate(donationObj, onetimeDOnationSchema);

    if (errorObject) {

      //errorObject.flag = 400;
      //callback(errorObject);
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }


  function commonValidationObjectConstructor(errorObject, callback) {

    var errObj = {
      status: 400,
      errors: []
    };

    for (var i in errorObject) {
      errObj.errors.push(errorObject[i][0]);
    }

    callback(new Error(JSON.stringify(errObj)), null);
  }


  function wepayUserRegister(userObj, callback) {

    var userSchema = {
      id: {
        presence: true
      }
    };
    var errorObject = validate(userObj, userSchema);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function userIdValidations(userId, callback) {
    var donorUserIdValidations = {
      userId: {
        presence: true
      }
    };
    var errorObject = validate(userId, donorUserIdValidations);

    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }


  function cancelSubscription(subObj, callback) {

    //subscription_id, subscription_plan_id, charity_tbl

    var subscriptionCancelSchema = {
     /* subscription_id: {
        presence: true
      },
      subscription_plan_id: {
        presence: true
      },
      charity_id: {
        presence: true
      }*/
    };
    var errorObject = validate(subObj, subscriptionCancelSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function wepayAccountValidation(obj, callback) {
    var wepayAccountSchema = {
      account_id: {
        presence: true
      }
    };
    var errorObject = validate(obj, wepayAccountSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function wepayCheckoutValidation(obj, callback) {
    var wepayCheckoutSchema = {
      checkout_id: {
        presence: true
      }
    };
    var errorObject = validate(obj, wepayCheckoutSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function wepaySubscriptionValidation(obj, callback) {
    var wepaySubscriptionSchema = {
      subscription_id: {
        presence: true
      }
    };
    var errorObject = validate(obj, wepaySubscriptionSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }

  function emailValidation(obj, callback) {
    var wepayAccountSchema = {
     /* email: {
        presence: true,
        email: true
      }*/
      email: {
        presence: {
          message: "^Please enter a valid email"
        },
        email: true,
        email: {
          message: "^Please enter a valid email",
          length: {
            maximum: 255
          }
        },
        sanitizeAll: true
      },
    };
    var errorObject = validate(obj, wepayAccountSchema);
    if (errorObject) {
      commonValidationObjectConstructor(errorObject, callback);
    } else {
      callback(null);
    }
  }
  return {
    login: login,
    changePassword: changePassword,
    userRegistration: userRegistration,
    paramExistsAndNumber: paramExistsAndNumber,
    validateCategory: validateCategory,
    validateCharityAdmin: validateCharityAdmin,
    paramUserExistsAndNumber: paramUserExistsAndNumber,
    paramAdminUserExistsAndNumber: paramAdminUserExistsAndNumber,
    existsCategoryAndNumber: existsCategoryAndNumber,
    validateCreateCode: validateCreateCode,
    commonParamExistsAndNumber: commonParamExistsAndNumber,
    postFeed: postFeed,
    commonParamExistsAndString: commonParamExistsAndString,
    validateCodeId: validateCodeId,
    updateCharityCategoryCode: updateCharityCategoryCode,
    fundraiseCodeUpdate: fundraiseCodeUpdate,
    validateTransactions: validateTransactions,
    validateStatistics: validateStatistics,
    paramCodeId: paramCodeId,
    validateCharityProfile: validateCharityProfile,
    validatePostCategorys: validatePostCategorys,
    validateUploadProfileObj: validateUploadProfileObj,
    paramExistsAndNumberSer: paramExistsAndNumberSer,
    validateUserId: validateUserId,
    validateUserIdAndEmailId: validateUserIdAndEmailId,
    validateOrg: validateOrg,
    transInfoOfDates: transInfoOfDates,
    transYearInfo: transYearInfo,
    accountDetailsValidate: accountDetailsValidate,
    activeYearSummary: activeYearSummary,
    updatePostValidation: updatePostValidation,
    validateYear: validateYear,
    validateVerificationKey: validateVerificationKey,
    checkEmailValidate: checkEmailValidate,
    changePasswordValidate: changePasswordValidate,
    mentionsentityId: mentionsentityId,
    campaignCodeVaidation: campaignCodeVaidation,
    mentionsPostId: mentionsPostId,
    onetimeDonation: onetimeDonation,
    wepayUserRegister: wepayUserRegister,
    userIdValidations: userIdValidations,
    cancelSubscription: cancelSubscription,
    wepayAccountValidation: wepayAccountValidation,
    emailValidation: emailValidation,
    wepayCheckoutValidation: wepayCheckoutValidation,
    wepaySubscriptionValidation: wepaySubscriptionValidation,
    validateEmailLength:validateEmailLength
  };

})();
