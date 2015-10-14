'use strict'

var React = require('react');

module.exports = {
  getInitialState: function () {
    var value = this.props.value || null;
    if (this.props.component.multiple && !Array.isArray(value)) {
      value = [value];
    }
    // If this was a multivalue but is now single value.
    else if (!this.props.component.multiple && Array.isArray(value)) {
      value = value[0];
    }
    return {
      value: value,
      isValid: true,
      errorMessage: '',
      isPristine: true
    };
  },
  componentWillMount: function () {
    this.props.attachToForm(this);
  },
  componentWillUnmount: function () {
    this.props.detachFromForm(this);
  },
  onChange: function(event) {
    var value = event.currentTarget.value;
    var index = (this.props.component.multiple ? event.currentTarget.getAttribute('data-index') : null);
    this.setValue(value, index);
  },
  setValue: function (value, index) {
    this.setState(function(previousState, currentProps) {
      if (index) {
        previousState.value[index] = value;
      }
      else {
        previousState.value = value;
      }
      previousState.isPristine = false;
      return previousState;
    }, function() {
      if (typeof this.props.validate === 'function') {
        this.props.validate(this)
      }
    }.bind(this));
  },
  getComponent: function() {
    var classNames = "form-group has-feedback form-field-type-" + this.props.component.type + (this.state.errorMessage !== '' && !this.state.isPristine ? ' has-error': '');
    var id = "form-group-" + this.props.component.key;
    var Elements = this.getElements();
    var Error = (this.state.errorMessage && !this.state.isPristine ? <p className="help-block">{this.state.errorMessage}</p> : '');
    return (
      <div className={classNames} id={id}>
        <div>
          {Elements}
        </div>
        {Error}
      </div>
    );
  },
  render: function() {
    return this.getComponent();
  }
};