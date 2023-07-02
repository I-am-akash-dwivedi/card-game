let details = []

$('#submit').on('click', function() {
  let form_data = $('#details_form').serializeArray();
  let data = {};
  for (let i = 0; i < form_data.length; i++) {
    data[form_data[i].name] = form_data[i].value;
  }
  let validation_msg = validateForm(data);
  console.log(validation_msg)
  if (!validation_msg) {
    details.push(data);
    render_card(data);
    $.toast({
      heading: 'Success',
      text: 'Details added successfully!',
      showHideTransition: 'slide',
      icon: 'success',
      position: 'top-right',
    })
  } else {
    Object.entries(validation_msg).forEach(([key, value]) => {
      $(`#${key}`).text(value);
    });
  }
});

function validateForm(data) {
  const first_name = data.first_name;
  const last_name = data.last_name;
  const email = data.email;
  const mobile = data.mobile;
  const city = data.city;
  const zipcode = data.zipcode;
  const dob = data.dob;
  let errors = {};

  if (first_name.trim() === "") {
    errors["first_name_error"] = "Please enter first name.";
  }

  if (last_name.trim() === "") {
    errors["last_name_error"] = "Please enter last name.";
  }

  if (email.trim() === "") {
    errors["email_error"] = "Please enter email.";
  }

  if (!isValidEmail(email)) {
    errors["email_error"] = "Please enter valid email.";
  }

  if (mobile.trim() === "") {
    errors["mobile_error"] = "Please enter mobile number.";
  }

  if (mobile.length !== 10) {
    errors["mobile_error"] = "Please enter valid mobile number.";
  }

  if (city.trim() === "") {
    errors["city_error"] = "Please enter city.";
  }

  if (zipcode.trim() === "") {
    errors["zipcode_error"] = "Please enter zipcode.";
  }

  if (zipcode.length !== 6) {
    errors["zipcode_error"] = "Please enter valid zipcode.";
  }

  if (dob.trim() === "") {
    errors["dob_error"] = "Please enter date of birth.";
  }

  if (calculate_age(dob) < 18) {
    errors["dob_error"] = "You must be 18 years old.";
  }

  return errors;
}

function calculate_age(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
  {
    age--;
  }
  return age;
}

function isValidEmail(email) {
  // Basic email validation using a regular expression
  var emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
  return emailPattern.test(email);
}

function render_card(person_details) {
  let card = `<div class="col-sm-5">
      <div class="card my-2">
        <div class="card-body">
          <h5 class="card-title">Name: ${person_details.first_name} ${person_details.last_name}</h5>
          <p class="card-text">Email: ${person_details.email}</p>
          <p class="card-text">Date of birth: ${person_details.dob}</p>
          <p class="card-text">Phone: ${person_details.country_code} ${person_details.mobile}</p>
          <p class="card-text">City: ${person_details.city}</p>
          <p class="card-text">Pincode/Zipcode: ${person_details.zipcode}</p>
        </div>
      </div>
    </div>`
  $('#detail_card').append(card);
}

