'use strict'

var formiojs = require('formiojs')();
var FormioComponent = require('./react-formio-component');

require('./components');

module.exports = React.createClass({
  displayName: 'Formio',
  getInitialState: function() {
    return {
      form: this.props.form || {},
      submission: this.props.submission || {},
      submissions: this.props.submissions || [],
      isSubmitting: false,
      isValid: true
    };
  },
  getDefaultProps: function() {
    return {
      readOnly: false,
      formAction: false
    };
  },
  componentWillMount: function () {
    this.data = {};
    this.inputs = {};
  },
  attachToForm: function (component) {
    this.inputs[component.props.component.key] = component;
    this.data[component.props.component.key] = component.state.value;
    this.validate(component);
  },
  detachFromForm: function (component) {
    delete this.inputs[component.props.name];
    delete this.data[component.props.name];
  },
  validate: function(component) {
    var state = {
      isValid: true,
      errorMessage: ''
    };
    // Validate each item if multiple.
    if (component.props.component.multiple) {
      component.state.value.forEach(function(item, index) {
        if (state.isValid) {
          state = this.validateItem(item, component);
        }
      }.bind(this));
    }
    else {
      state = this.validateItem(component.state.value, component);
    }
    component.setState(state, this.validateForm);
  },
  validateItem: function(item, component) {
    var state = {
      isValid: true,
      errorMessage: ''
    };
    if (item || component.props.component.validate.required) {
      if (item && item.length) {
        // MaxLength
        if (state.isValid && component.props.component.validate.maxLength && item.length > component.props.component.validate.maxLength) {
          state.isValid = false;
          state.errorMessage = (component.props.component.label || component.props.component.key) + ' must be shorter than ' + (component.props.component.validate.maxLength + 1) + ' characters';
        }
        // MinLength
        if (state.isValid && component.props.component.validate.minLength && item.length < component.props.component.validate.minLength) {
          state.isValid =  false;
          state.errorMessage = (component.props.component.label || component.props.component.key) + ' must be longer than ' + (component.props.component.validate.minLength - 1) + ' characters';
        }
        // Regex
        if (state.isValid && component.props.component.validate.pattern) {
          var re = new RegExp(component.props.component.validate.pattern, "g");
          state.isValid = item.match(re);
          if (!state.isValid) {
            state.errorMessage = (component.props.component.label || component.props.component.key) + ' must match the expression: ' + component.props.component.validate.pattern;
          }
        }
        // Custom
        if (state.isValid && component.props.component.validate.custom) {
          var custom = component.props.component.validate.custom;
          custom = custom.replace(/({{\s+(.*)\s+}})/, function(match, $1, $2) {
            // TODO: need to ensure this.data has up to date values.
            return this.data[$2];
          });
          /* jshint evil: true */
          var valid = eval(custom);
          state.isValid = (valid === true);
          if (!state.isValid) {
            state.errorMessage = valid || ((component.props.component.label || component.props.component.key) + "is not a valid value.");
          }
        }
      }
      // Only gets here if required but no value.
      else {
        state.isValid = false;
        state.errorMessage = (component.props.component.label || component.props.component.key) + ' is required.';
      }
    }
    return state;
  },
  componentDidMount: function() {
    if (this.props.src) {
      this.formio = new formiojs(this.props.src);
      this.formio.loadForm().then(function(form) {
        this.setState({
          form: form
        }, this.validateForm);
      }.bind(this));
      if (this.formio.submissionId) {
        this.formio.loadSubmission().then(function(submission) {
          this.setState({
            submission: submission
          }, this.validateForm)
        }.bind(this));
      }
    }
  },
  updateData: function(component) {
    Object.keys(this.inputs).forEach(function (name) {
      this.data[name] = this.inputs[name].state.value;
    }.bind(this));
  },
  validateForm: function () {
    var allIsValid = true;

    var inputs = this.inputs;
    Object.keys(inputs).forEach(function (name) {
      if (!inputs[name].state.isValid) {
        allIsValid = false;
      }
    });

    this.setState({
      isValid: allIsValid
    });
  },
  onSubmit: function (event) {
    event.preventDefault();
    this.setState({
      isSubmitting: true
    });
    this.updateData();
    var sub = this.state.submission;
    sub.data = this.data;

    // Do the submit here.
    // TODO: Allow custom action handler.
    this.formio.saveSubmission(sub).then(function(submission) {
      this.setState({
        submission: submission,
        isSubmitting: false
      });
    }.bind(this));
  },
  render: function() {
    if (this.state.form.components) {
      this.componentNodes = this.state.form.components.map(function(component) {
        var value = (this.state.submission.data && this.state.submission.data.hasOwnProperty(component.key) ? this.state.submission.data[component.key] : component.defaultValue || '');
        return (
          <FormioComponent
            key={component.key}
            component={component}
            value={value}
            readOnly={this.props.readOnly}
            attachToForm={this.attachToForm}
            detachFromForm={this.detachFromForm}
            validate={this.validate}
            isSubmitting={this.state.isSubmitting}
            isFormValid={this.state.isValid}
          />
        );
      }.bind(this));
    }
    var loading = <i id="formio-loading" className="glyphicon glyphicon-refresh glyphicon-spin"></i>;
    return (
      <form role="form" name="formioForm" onSubmit={this.onSubmit}>
        <div ng-repeat="alert in formioAlerts" className="alert" role="alert">
        </div>
        {this.componentNodes}
      </form>
    );
  }
});
