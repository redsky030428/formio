import React from 'react';
import {FormioComponentsList} from '../FormioComponentsList';

module.exports = React.createClass({
  displayName: 'Well',
  render: function() {
    return (
      <div className="well">
        <FormioComponentsList
          {...this.props}
          components={this.props.component.components}
        ></FormioComponentsList>
      </div>
    );
  }
});
